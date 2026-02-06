import { useState, useRef } from "react";
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
import { FileText, Building, Home, Plus, Loader2, UserPlus, Pencil, Download, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Contract, Property, User } from "@shared/schema";

interface ContractWithRelations extends Contract {
  property: Property;
  customer: User;
  rm?: User;
}

const contractSchema = z.object({
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

type ContractFormData = z.infer<typeof contractSchema>;

export default function AdminContracts() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const createForm = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
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

  const editForm = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
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

  const preparePayload = (data: ContractFormData) => ({
    ...data,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
    rmId: data.rmId || null,
    rentUpliftPercent: data.rentUpliftPercent || null,
    rentUpliftClause: data.rentUpliftClause || null,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      await apiRequest("POST", "/api/admin/contracts", preparePayload(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] });
      createForm.reset();
      setCreateOpen(false);
      toast({ title: "Contract created", description: "The contract has been created successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create contract", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContractFormData }) => {
      await apiRequest("PUT", `/api/admin/contracts/${id}`, preparePayload(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] });
      editForm.reset();
      setEditOpen(false);
      setEditingContract(null);
      toast({ title: "Contract updated", description: "The contract has been updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update contract", variant: "destructive" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (contractsData: any[]) => {
      await apiRequest("POST", "/api/admin/contracts/bulk", { contracts: contractsData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] });
      toast({ title: "Import successful", description: "Contracts have been imported successfully." });
    },
    onError: (error) => {
      toast({ title: "Import failed", description: error instanceof Error ? error.message : "Failed to import contracts", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] });
      toast({ title: "Contract deleted", description: "The contract has been deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete contract", variant: "destructive" });
    },
  });

  const handleDelete = (contract: ContractWithRelations) => {
    if (confirm(`Are you sure you want to delete contract "${contract.leaseNumber}"?`)) {
      deleteMutation.mutate(contract.id);
    }
  };

  const onCreateSubmit = (data: ContractFormData) => createMutation.mutate(data);
  const onEditSubmit = (data: ContractFormData) => {
    if (editingContract) editMutation.mutate({ id: editingContract.id, data });
  };

  const handleEdit = (contract: ContractWithRelations) => {
    setEditingContract(contract);
    const formatDate = (d: Date | string) => new Date(d).toISOString().split("T")[0];
    editForm.reset({
      leaseNumber: contract.leaseNumber,
      customerId: contract.customerId,
      propertyId: contract.propertyId,
      rmId: contract.rmId || "",
      sqft: contract.sqft,
      rentPerMonth: contract.rentPerMonth,
      securityDeposit: contract.securityDeposit,
      startDate: formatDate(contract.startDate),
      endDate: formatDate(contract.endDate),
      renewalDate: contract.renewalDate ? formatDate(contract.renewalDate) : "",
      rentUpliftPercent: contract.rentUpliftPercent || "",
      rentUpliftClause: contract.rentUpliftClause || "",
      status: contract.status as any,
    });
    setEditOpen(true);
  };

  const handleExportTemplate = () => {
    const headers = ["leaseNumber", "customerId", "propertyId", "rmId", "sqft", "rentPerMonth", "securityDeposit", "startDate", "endDate", "renewalDate", "rentUpliftPercent", "rentUpliftClause", "status"];
    const csvContent = headers.join(",") + "\nABC-2024-001,customer_id,property_id,rm_id,1200,85000,510000,2024-01-01,2027-01-01,2026-10-01,5.00,5% annual escalation,active";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contracts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    const headers = ["leaseNumber", "customerId", "customerName", "propertyId", "propertyName", "rmId", "rmName", "sqft", "rentPerMonth", "securityDeposit", "startDate", "endDate", "status"];
    const csvContent = [
      headers.join(","),
      ...contracts.map(c => [
        c.leaseNumber,
        c.customerId,
        `"${c.customer.name}"`,
        c.propertyId,
        `"${c.property.name}"`,
        c.rmId || "",
        c.rm?.name ? `"${c.rm.name}"` : "",
        c.sqft,
        c.rentPerMonth,
        c.securityDeposit,
        new Date(c.startDate).toISOString().split("T")[0],
        new Date(c.endDate).toISOString().split("T")[0],
        c.status
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contracts_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const contractsData = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, "")) || [];
        const contract: Record<string, any> = {};
        headers.forEach((header, index) => {
          const val = values[index] || "";
          if (header === "sqft") contract[header] = parseInt(val) || 0;
          else contract[header] = val;
        });
        return contract;
      });
      bulkImportMutation.mutate(contractsData);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "expired": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending_renewal": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "terminated": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const ContractForm = ({ form, onSubmit, isPending, submitText }: { form: any; onSubmit: any; isPending: boolean; submitText: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="leaseNumber" render={({ field }) => (
          <FormItem><FormLabel>Lease Number</FormLabel><FormControl><Input placeholder="ABC-MUM-2024-001" data-testid="input-lease-number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="customerId" render={({ field }) => (
            <FormItem><FormLabel>Customer (Tenant)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="propertyId" render={({ field }) => (
            <FormItem><FormLabel>Property</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-property"><SelectValue placeholder="Select property" /></SelectTrigger></FormControl>
                <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.city})</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="rmId" render={({ field }) => (
          <FormItem><FormLabel>Relationship Manager (Optional)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-rm"><SelectValue placeholder="Select RM" /></SelectTrigger></FormControl>
              <SelectContent>{rms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="sqft" render={({ field }) => (<FormItem><FormLabel>Area (sq.ft)</FormLabel><FormControl><Input type="number" placeholder="1200" data-testid="input-sqft" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="rentPerMonth" render={({ field }) => (<FormItem><FormLabel>Rent per Month</FormLabel><FormControl><Input placeholder="85000" data-testid="input-rent" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input placeholder="510000" data-testid="input-deposit" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" data-testid="input-start-date" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" data-testid="input-end-date" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="renewalDate" render={({ field }) => (<FormItem><FormLabel>Renewal Date (Optional)</FormLabel><FormControl><Input type="date" data-testid="input-renewal-date" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="rentUpliftPercent" render={({ field }) => (<FormItem><FormLabel>Rent Uplift % (Optional)</FormLabel><FormControl><Input placeholder="5.00" data-testid="input-uplift-percent" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="pending_renewal">Pending Renewal</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="rentUpliftClause" render={({ field }) => (<FormItem><FormLabel>Rent Uplift Clause (Optional)</FormLabel><FormControl><Input placeholder="5% annual escalation" data-testid="input-uplift-clause" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-contract">
          {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : submitText}
        </Button>
      </form>
    </Form>
  );

  if (isLoading) return (<div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="h-6 w-6" />Contracts</h1>
          <p className="text-muted-foreground">All lease contracts in the system ({contracts.length})</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportTemplate} data-testid="button-export-template"><Download className="mr-2 h-4 w-4" />Template</Button>
          <Button variant="outline" onClick={handleExportData} data-testid="button-export-data"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={bulkImportMutation.isPending} data-testid="button-import"><Upload className="mr-2 h-4 w-4" />Import CSV</Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button data-testid="button-create-contract"><UserPlus className="mr-2 h-4 w-4" />Map User to Property</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Contract</DialogTitle></DialogHeader>
              <ContractForm form={createForm} onSubmit={onCreateSubmit} isPending={createMutation.isPending} submitText="Create Contract" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Contract</DialogTitle></DialogHeader>
          <ContractForm form={editForm} onSubmit={onEditSubmit} isPending={editMutation.isPending} submitText="Save Changes" />
        </DialogContent>
      </Dialog>

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
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No contracts found</TableCell></TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                    <TableCell className="font-mono text-sm">{contract.leaseNumber}</TableCell>
                    <TableCell><div className="flex items-center gap-2">{contract.property.type === "retail" ? <Building className="h-4 w-4 text-primary" /> : <Home className="h-4 w-4 text-primary" />}{contract.property.name}</div></TableCell>
                    <TableCell>{contract.customer.name}</TableCell>
                    <TableCell>{contract.rm?.name || "-"}</TableCell>
                    <TableCell className="text-right">{contract.sqft.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(parseFloat(contract.rentPerMonth))}</TableCell>
                    <TableCell><Badge className={getStatusColor(contract.status)}>{contract.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell>{format(new Date(contract.endDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)} data-testid={`button-edit-contract-${contract.id}`}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(contract)} data-testid={`button-delete-contract-${contract.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
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
