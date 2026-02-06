import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useContract } from "@/lib/contract-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Square,
  IndianRupee,
  Calendar,
  Shield,
  TrendingUp,
  Building,
  Home,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import type { ContractWithDetails } from "@shared/schema";

export default function CustomerDashboard() {
  const { selectedContractId, setSelectedContractId } = useContract();

  const { data: contracts = [], isLoading } = useQuery<ContractWithDetails[]>({
    queryKey: ["/api/customer/contracts"],
  });

  const filteredContracts = selectedContractId
    ? contracts.filter((c) => c.id === selectedContractId)
    : contracts;

  const aggregatedKpis = {
    totalSqft: filteredContracts.reduce((sum, c) => sum + c.sqft, 0),
    avgRent:
      filteredContracts.length > 0
        ? filteredContracts.reduce((sum, c) => sum + parseFloat(c.rentPerMonth), 0) /
          filteredContracts.length
        : 0,
    totalRent: filteredContracts.reduce((sum, c) => sum + parseFloat(c.rentPerMonth), 0),
    totalDeposit: filteredContracts.reduce(
      (sum, c) => sum + parseFloat(c.securityDeposit),
      0
    ),
    nextRenewal:
      filteredContracts.length > 0
        ? filteredContracts
            .filter((c) => c.renewalDate)
            .sort(
              (a, b) =>
                new Date(a.renewalDate!).getTime() -
                new Date(b.renewalDate!).getTime()
            )[0]?.renewalDate
        : null,
    avgUplift:
      filteredContracts.length > 0
        ? filteredContracts
            .filter((c) => c.rentUpliftPercent)
            .reduce((sum, c) => sum + parseFloat(c.rentUpliftPercent || "0"), 0) /
            filteredContracts.filter((c) => c.rentUpliftPercent).length || 0
        : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending_renewal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "terminated":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {selectedContractId
            ? `Viewing: ${
                contracts.find((c) => c.id === selectedContractId)?.property.name
              }`
            : "Overview of all your properties"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Area
            </CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedKpis.totalSqft.toLocaleString()} sq.ft
            </div>
            <p className="text-xs text-muted-foreground">
              Across {filteredContracts.length} contract(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {selectedContractId ? "Monthly Rent" : "Avg. Monthly Rent"}
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                selectedContractId ? aggregatedKpis.totalRent : aggregatedKpis.avgRent
              )}
            </div>
            {!selectedContractId && (
              <p className="text-xs text-muted-foreground">
                Total: {formatCurrency(aggregatedKpis.totalRent)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Security Deposit
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(aggregatedKpis.totalDeposit)}
            </div>
            <p className="text-xs text-muted-foreground">Held with ABC Real Estate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lease Period
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {filteredContracts.length > 0 ? (
              <>
                <div className="text-lg font-semibold">
                  {format(new Date(filteredContracts[0].startDate), "MMM yyyy")} -{" "}
                  {format(new Date(filteredContracts[0].endDate), "MMM yyyy")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedContractId
                    ? "Contract duration"
                    : `Latest: ${filteredContracts[0].property.name}`}
                </p>
              </>
            ) : (
              <div className="text-lg font-semibold text-muted-foreground">
                No contracts
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Renewal
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedKpis.nextRenewal
                ? format(new Date(aggregatedKpis.nextRenewal), "dd MMM yyyy")
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming renewal date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rent Uplift
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregatedKpis.avgUplift > 0
                ? `${aggregatedKpis.avgUplift.toFixed(1)}%`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedContractId
                ? filteredContracts[0]?.rentUpliftClause || "No clause specified"
                : "Average across contracts"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lease #</TableHead>
                <TableHead className="text-right">Sq.ft</TableHead>
                <TableHead className="text-right">Rent/Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  className={
                    selectedContractId === contract.id ? "bg-muted/50" : ""
                  }
                  data-testid={`row-contract-${contract.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {contract.property.type === "retail" ? (
                        <Building className="h-4 w-4 text-primary" />
                      ) : (
                        <Home className="h-4 w-4 text-primary" />
                      )}
                      {contract.property.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {contract.property.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {contract.leaseNumber}
                  </TableCell>
                  <TableCell className="text-right">
                    {contract.sqft.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(parseFloat(contract.rentPerMonth))}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/customer/contract/${contract.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-contract-${contract.id}`}
                      >
                        <Eye className="mr-1 h-3 w-3" /> Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
