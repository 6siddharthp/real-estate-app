import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Building, Home, Plus, Loader2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import type { Contract, Property, User } from "@shared/schema";

interface ContractWithRelations extends Contract {
  property: Property;
  customer: User;
  rm?: User;
}

const createContractSchema = z.object({
  leaseNumber: z.string().min(3, "Lease number is required"),
  customerId: z.string().min(1, "Customer is required"),
  propertyId: z.string().min(1, "Property is required"),
  rmId: z.string().optional(),
  sqft: z.coerce.number().min(1, "Square footage must be greater than 0"),
  rentPerMonth: z.string().min(1, "Rent is required"),
  securityDeposit: z.string().min(1, "Security deposit is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  renewalDate: z.string().optional(),
  rentUpliftPercent: z.string().optional(),
  rentUpliftClause: z.string().optional(),
  status: z.enum(["active", "expired", "terminated", "pending_renewal"]).default("active"),
});

type CreateContractFormData = z.infer<typeof createContractSchema>;

export default function AdminContracts() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: contracts = [], isLoading } = useQuery<ContractWithRelations[]>({
    queryKey: ["/api/admin/contracts"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties"],
  });

  const customers = users.filter((u) => u.role === "customer");
  const rms = users.filter((u) => u.role === "rm");

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      leaseNumber: "",
      customerId: "",
      propertyId: "",
      rmId: "",
      sqft: 0,
      rentPerMonth: "",
      securityDeposit: "",
      startDate: "",
      endDate: "",
      renewalDate: "",
      rentUpliftPercent: "",
      rentUpliftClause: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateContractFormData) => {
      const payload = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        rmId: data.rmId || null,
        rentUpliftPercent: data.rentUpliftPercent || null,
        rentUpliftClause: data.rentUpliftClause || null,
      };
      await apiRequest("POST", "/api/admin/contracts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] });
      form.reset();
      setOpen(false);
      toast({
        title: "Contract created",
        description: "The contract has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contract",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateContractFormData) => {
    createMutation.mutate(data);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Contracts
          </h1>
          <p className="text-muted-foreground">
            All lease contracts in the system ({contracts.length})
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-contract">
              <UserPlus className="mr-2 h-4 w-4" />
              Map User to Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Contract (Map User to Property)</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="leaseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lease Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC-MUM-2024-001"
                          data-testid="input-lease-number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer (Tenant)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.name} ({property.city})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rmId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship Manager (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-rm">
                            <SelectValue placeholder="Select RM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rms.map((rm) => (
                            <SelectItem key={rm.id} value={rm.id}>
                              {rm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area (sq.ft)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1200"
                            data-testid="input-sqft"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rentPerMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent per Month</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="85000"
                            data-testid="input-rent"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="510000"
                            data-testid="input-deposit"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-start-date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-end-date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="renewalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-renewal-date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rentUpliftPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent Uplift % (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="5.00"
                            data-testid="input-uplift-percent"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rentUpliftClause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Uplift Clause (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5% annual escalation on lease anniversary"
                          data-testid="input-uplift-clause"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-contract"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Contract"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
