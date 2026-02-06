import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Building,
  Home,
  Plus,
  AlertTriangle,
  IndianRupee,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import type { ContractWithDetails, BillWithContract } from "@shared/schema";

export default function RMBills() {
  const { toast } = useToast();
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billMonth, setBillMonth] = useState(new Date().getMonth() + 1);
  const [billYear, setBillYear] = useState(new Date().getFullYear());
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: rmContracts = [], isLoading: contractsLoading } = useQuery<ContractWithDetails[]>({
    queryKey: ["/api/rm/contracts"],
  });

  const { data: rmBills = [], isLoading: billsLoading } = useQuery<BillWithContract[]>({
    queryKey: ["/api/rm/bills"],
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: {
      contractId: string;
      invoiceNumber: string;
      month: number;
      year: number;
      amountDue: string;
      dueDate: string;
    }) => {
      const res = await apiRequest("POST", "/api/rm/bills", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rm/bills"] });
      setAddBillOpen(false);
      resetForm();
      toast({ title: "Bill created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create bill", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/rm/bills/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rm/bills"] });
      toast({ title: "Bill status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedContractId("");
    setInvoiceNumber("");
    setBillMonth(new Date().getMonth() + 1);
    setBillYear(new Date().getFullYear());
    setAmountDue("");
    setDueDate("");
  };

  const handleCreateBill = () => {
    if (!selectedContractId || !invoiceNumber || !amountDue || !dueDate) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createBillMutation.mutate({
      contractId: selectedContractId,
      invoiceNumber,
      month: billMonth,
      year: billYear,
      amountDue,
      dueDate,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "unpaid":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "partial":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  const isLoading = contractsLoading || billsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalOutstanding = rmBills
    .filter((b) => b.status === "unpaid" || b.status === "overdue")
    .reduce((sum, b) => sum + parseFloat(b.amountDue) - parseFloat(b.amountPaid), 0);

  const overdueCount = rmBills.filter((b) => b.status === "overdue").length;
  const unpaidCount = rmBills.filter((b) => b.status === "unpaid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-bills-title">
            Bills & Rent Management
          </h1>
          <p className="text-muted-foreground">
            Manage bills and rent status for your assigned contracts
          </p>
        </div>
        <Dialog open={addBillOpen} onOpenChange={setAddBillOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-bill">
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Contract / Property</Label>
                <Select value={selectedContractId} onValueChange={(val) => {
                  setSelectedContractId(val);
                  const contract = rmContracts.find((c) => c.id === val);
                  if (contract) {
                    setAmountDue(contract.rentPerMonth);
                  }
                }}>
                  <SelectTrigger data-testid="select-contract">
                    <SelectValue placeholder="Select a contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {rmContracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.property.name} - {contract.leaseNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  data-testid="input-invoice-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={String(billMonth)} onValueChange={(val) => setBillMonth(parseInt(val))}>
                    <SelectTrigger data-testid="select-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {new Date(2000, i).toLocaleString("default", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={billYear}
                    onChange={(e) => setBillYear(parseInt(e.target.value))}
                    data-testid="input-year"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount Due</Label>
                <Input
                  type="number"
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="Enter amount"
                  data-testid="input-amount-due"
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-due-date"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateBill}
                disabled={createBillMutation.isPending}
                data-testid="button-submit-bill"
              >
                {createBillMutation.isPending ? "Creating..." : "Create Bill"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-outstanding">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">Across all contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Bills
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-overdue-count">
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unpaid Bills
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-unpaid-count">
              {unpaidCount}
            </div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Properties & Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          {rmContracts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No contracts assigned to you
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Lease #</TableHead>
                  <TableHead className="text-right">Rent/Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rmContracts.map((contract) => {
                  const contractBills = rmBills.filter((b) => b.contractId === contract.id);
                  const hasOverdue = contractBills.some((b) => b.status === "overdue");
                  const hasUnpaid = contractBills.some((b) => b.status === "unpaid");
                  return (
                    <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
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
                        {formatCurrency(contract.rentPerMonth)}
                      </TableCell>
                      <TableCell>
                        <Badge className={contract.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800"}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasOverdue && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Overdue
                            </Badge>
                          )}
                          {hasUnpaid && !hasOverdue && (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Unpaid
                            </Badge>
                          )}
                          {!hasOverdue && !hasUnpaid && contractBills.length > 0 && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              All Paid
                            </Badge>
                          )}
                          {contractBills.length === 0 && (
                            <span className="text-xs text-muted-foreground">No bills</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {rmBills.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No bills created yet. Use the "Add Bill" button to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount Due</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rmBills
                  .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                  .map((bill) => (
                  <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-invoice-${bill.id}`}>
                      {bill.invoiceNumber}
                    </TableCell>
                    <TableCell>{bill.property.name}</TableCell>
                    <TableCell>
                      {new Date(2000, bill.month - 1).toLocaleString("default", { month: "short" })}{" "}
                      {bill.year}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.amountDue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bill.amountPaid)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(bill.dueDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bill.status)} data-testid={`badge-status-${bill.id}`}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {bill.status === "unpaid" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: bill.id, status: "overdue" })
                            }
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-mark-overdue-${bill.id}`}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Mark Overdue
                          </Button>
                        )}
                        {(bill.status === "unpaid" || bill.status === "overdue") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: bill.id, status: "paid" })
                            }
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-mark-paid-${bill.id}`}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {bill.status === "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: bill.id, status: "unpaid" })
                            }
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-mark-unpaid-${bill.id}`}
                          >
                            Mark Unpaid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
