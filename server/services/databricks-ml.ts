interface DatabricksConfig {
  host: string;
  token: string;
  endpointName: string;
}

interface ServiceRequestFeatures {
  requestType: string;
  subject: string;
  description: string;
  propertyType: string;
  propertyCity: string;
  customerId: string;
  contractId: string;
}

interface MLPrediction {
  assignedRmId: string;
  confidence: number;
}

function getConfig(): DatabricksConfig | null {
  const host = process.env.DATABRICKS_HOST;
  const token = process.env.DATABRICKS_TOKEN;
  const endpointName = process.env.DATABRICKS_ENDPOINT_NAME;

  if (!host || !token || !endpointName) {
    return null;
  }

  return {
    host: host.replace(/\/$/, ""),
    token,
    endpointName,
  };
}

export function isDatabricksConfigured(): boolean {
  return getConfig() !== null;
}

export async function predictServiceRepAssignment(
  features: ServiceRequestFeatures
): Promise<MLPrediction | null> {
  const config = getConfig();
  if (!config) {
    console.log("Databricks ML not configured, skipping prediction");
    return null;
  }

  const url = `${config.host}/serving-endpoints/${config.endpointName}/invocations`;

  try {
    const payload = {
      dataframe_split: {
        columns: [
          "request_type",
          "subject",
          "description",
          "property_type",
          "property_city",
          "customer_id",
          "contract_id",
        ],
        data: [
          [
            features.requestType,
            features.subject,
            features.description,
            features.propertyType,
            features.propertyCity,
            features.customerId,
            features.contractId,
          ],
        ],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Databricks ML error (${response.status}): ${errorText}`);
      return null;
    }

    const result = await response.json();

    const prediction = parsePredictionResponse(result);
    if (prediction) {
      console.log(
        `Databricks ML prediction: RM ${prediction.assignedRmId} (confidence: ${prediction.confidence})`
      );
    }

    return prediction;
  } catch (error) {
    console.error("Databricks ML request failed:", error);
    return null;
  }
}

function parsePredictionResponse(result: any): MLPrediction | null {
  try {
    if (result.predictions && Array.isArray(result.predictions) && result.predictions.length > 0) {
      const pred = result.predictions[0];

      if (typeof pred === "object" && pred.assigned_rm_id) {
        return {
          assignedRmId: String(pred.assigned_rm_id),
          confidence: typeof pred.confidence === "number" ? pred.confidence : 0,
        };
      }

      if (typeof pred === "string") {
        return {
          assignedRmId: pred,
          confidence: 0,
        };
      }
    }

    if (result.assigned_rm_id) {
      return {
        assignedRmId: String(result.assigned_rm_id),
        confidence: typeof result.confidence === "number" ? result.confidence : 0,
      };
    }

    console.warn("Unexpected Databricks response format:", JSON.stringify(result));
    return null;
  } catch (error) {
    console.error("Error parsing Databricks prediction response:", error);
    return null;
  }
}

export async function healthCheck(): Promise<{
  configured: boolean;
  reachable: boolean;
  error?: string;
}> {
  const config = getConfig();
  if (!config) {
    return { configured: false, reachable: false };
  }

  try {
    const url = `${config.host}/api/2.0/serving-endpoints/${config.endpointName}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const isReady = data.state?.ready === "READY";
      return {
        configured: true,
        reachable: true,
        error: isReady ? undefined : `Endpoint state: ${data.state?.ready || "UNKNOWN"}`,
      };
    }

    return {
      configured: true,
      reachable: false,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
