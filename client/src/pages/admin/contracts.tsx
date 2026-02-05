import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { FileText, Building, Home } from "lucide-react";
import { format } from "date-fns";
import type { Contract, Property, User } from "@shared/schema";

interface ContractWithRelations extends Contract {
  property: Property;
  customer: User;
  rm?: User;
}

export default function AdminContracts() {
  const { data: contracts = [], isLoading } = useQuery<ContractWithRelations[]>({
    queryKey: ["/api/admin/contracts"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Contracts
        </h1>
        <p className="text-muted-foreground">
          All lease contracts in the system ({contracts.length})
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lease #</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>RM</TableHead>
                <TableHead className="text-right">Sq.ft</TableHead>
                <TableHead className="text-right">Rent/Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                    <TableCell className="font-mono text-sm">
                      {contract.leaseNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {contract.property.type === "retail" ? (
                          <Building className="h-4 w-4 text-primary" />
                        ) : (
                          <Home className="h-4 w-4 text-primary" />
                        )}
                        {contract.property.name}
                      </div>
                    </TableCell>
                    <TableCell>{contract.customer.name}</TableCell>
                    <TableCell>{contract.rm?.name || "-"}</TableCell>
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
                      {format(new Date(contract.endDate), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
