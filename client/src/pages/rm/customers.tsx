import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Mail, Phone, Building, Home, Eye } from "lucide-react";
import { format } from "date-fns";
import type { User, ContractWithDetails } from "@shared/schema";

interface CustomerWithContracts extends User {
  contracts: ContractWithDetails[];
}

export default function RMCustomers() {
  const { data: customers = [], isLoading } = useQuery<CustomerWithContracts[]>({
    queryKey: ["/api/rm/customers"],
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" />
          My Customers
        </h1>
        <p className="text-muted-foreground">
          {customers.length} customer(s) assigned to you
        </p>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No customers assigned
            </h3>
            <p className="text-sm text-muted-foreground">
              You don't have any customers assigned yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => (
            <Card key={customer.id} data-testid={`card-customer-${customer.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Contracts ({customer.contracts.length})
                      </h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-contracts-${customer.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>
                              Contracts for {customer.name}
                            </DialogTitle>
                          </DialogHeader>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Lease #</TableHead>
                                <TableHead className="text-right">Rent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>End Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.contracts.map((contract) => (
                                <TableRow key={contract.id}>
                                  <TableCell className="font-medium">
                                    {contract.property.name}
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
                              ))}
                            </TableBody>
                          </Table>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customer.contracts.slice(0, 3).map((contract) => (
                        <Badge
                          key={contract.id}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {contract.property.type === "retail" ? (
                            <Building className="h-3 w-3" />
                          ) : (
                            <Home className="h-3 w-3" />
                          )}
                          {contract.property.name}
                        </Badge>
                      ))}
                      {customer.contracts.length > 3 && (
                        <Badge variant="secondary">
                          +{customer.contracts.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
