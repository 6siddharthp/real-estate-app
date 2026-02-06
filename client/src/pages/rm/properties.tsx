import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import type { ContractWithCustomer, DocumentWithContract } from "@shared/schema";

const documentCategories = [
  { value: "contract_letter", label: "Contract Letter" },
  { value: "lease_deed", label: "Lease Deed" },
  { value: "lessor_kyc", label: "Lessor KYC" },
  { value: "noc", label: "NOC" },
  { value: "occupancy_certificate", label: "Occupancy Certificate" },
  { value: "utility_invoice", label: "Utility Invoice" },
  { value: "rent_invoice", label: "Rent Invoice" },
  { value: "other", label: "Other" },
];

function getCategoryLabel(value: string) {
  return documentCategories.find((c) => c.value === value)?.label || value;
}

export default function RMProperties() {
  const { toast } = useToast();
  const [manageContractId, setManageContractId] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");

  const { data: contracts = [], isLoading } = useQuery<ContractWithCustomer[]>({
    queryKey: ["/api/rm/properties"],
  });

  const { data: contractDocs = [], isLoading: docsLoading } = useQuery<DocumentWithContract[]>({
    queryKey: ["/api/rm/documents", manageContractId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rm/documents?contractId=${manageContractId}`);
      return res.json();
    },
    enabled: !!manageContractId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { contractId: string; category: string; name: string; fileUrl: string }) => {
      await apiRequest("POST", "/api/rm/documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rm/documents", manageContractId] });
      toast({ title: "Document uploaded successfully" });
      setDocCategory("");
      setDocName("");
      setDocUrl("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to upload document", description: error.message, variant: "destructive" });
    },
  });

  const handleUpload = () => {
    if (!manageContractId || !docCategory || !docName || !docUrl) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      contractId: manageContractId,
      category: docCategory,
      name: docName,
      fileUrl: docUrl,
    });
  };

  const managedContract = contracts.find((c) => c.id === manageContractId);

  const activeCount = contracts.filter((c) => c.status === "active").length;
  const uniqueCustomers = new Set(contracts.map((c) => c.customerId)).size;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-properties-title">
          My Properties
        </h1>
        <p className="text-muted-foreground">
          Manage documents for your assigned properties and customers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-properties">
              {contracts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Leases
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-active-leases">
              {activeCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-unique-customers">
              {uniqueCustomers}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Properties & Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Lease Number</TableHead>
                <TableHead>Lease Period</TableHead>
                <TableHead className="text-right">Monthly Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No properties assigned
                  </TableCell>
                </TableRow>
              ) : (
                contracts
                  .sort((a, b) => {
                    if (a.status === "active" && b.status !== "active") return -1;
                    if (a.status !== "active" && b.status === "active") return 1;
                    return a.property.name.localeCompare(b.property.name);
                  })
                  .map((contract) => (
                    <TableRow key={contract.id} data-testid={`row-property-${contract.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-customer-${contract.id}`}>
                            {contract.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contract.customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium" data-testid={`text-property-${contract.id}`}>
                          {contract.property.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contract.property.type} - {contract.sqft} sq.ft
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-lease-${contract.id}`}>
                        {contract.leaseNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(contract.startDate), "dd MMM yyyy")} -{" "}
                          {format(new Date(contract.endDate), "dd MMM yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(contract.rentPerMonth)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            contract.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : contract.status === "expired"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }
                          data-testid={`badge-status-${contract.id}`}
                        >
                          {contract.status === "active" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => setManageContractId(contract.id)}
                          data-testid={`button-manage-${contract.id}`}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!manageContractId} onOpenChange={(open) => { if (!open) setManageContractId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manage Documents
            </DialogTitle>
            <DialogDescription>
              {managedContract && (
                <>
                  {managedContract.property.name} - {managedContract.customer.name} ({managedContract.leaseNumber})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload New Document
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="doc-category">Document Type</Label>
                  <Select value={docCategory} onValueChange={setDocCategory}>
                    <SelectTrigger data-testid="select-doc-category">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g., Lease Agreement - Jan 2026"
                    data-testid="input-doc-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-url">Document URL</Label>
                  <Input
                    id="doc-url"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    data-testid="input-doc-url"
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !docCategory || !docName || !docUrl}
                  data-testid="button-upload-doc"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Existing Documents
              </h3>
              {docsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : contractDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No documents uploaded for this property yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractDocs.map((doc) => (
                      <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                        <TableCell>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                            data-testid={`link-doc-${doc.id}`}
                          >
                            {doc.name}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" data-testid={`badge-doc-type-${doc.id}`}>
                            {getCategoryLabel(doc.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(doc.uploadedAt), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
