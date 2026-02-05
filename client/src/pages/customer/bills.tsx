import { useQuery } from "@tanstack/react-query";
import { useContract } from "@/lib/contract-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, AlertCircle, CheckCircle, Clock, Phone, Mail, User } from "lucide-react";
import { format } from "date-fns";
import type { BillWithContract, User as UserType } from "@shared/schema";

export default function CustomerBills() {
  const { selectedContractId } = useContract();

  const { data: bills = [], isLoading } = useQuery<BillWithContract[]>({
    queryKey: ["/api/customer/bills", selectedContractId],
  });

  const { data: rm } = useQuery<UserType>({
    queryKey: ["/api/customer/rm", selectedContractId],
    enabled: !!selectedContractId,
  });

  const filteredBills = selectedContractId
    ? bills.filter((b) => b.contractId === selectedContractId)
    : bills;

  const totalOutstanding = filteredBills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + (parseFloat(b.amountDue) - parseFloat(b.amountPaid)), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "partial":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const handleDownload = () => {
    const csv = [
      ["Invoice #", "Month", "Year", "Amount Due", "Amount Paid", "Status", "Due Date"],
      ...filteredBills.map((b) => [
        b.invoiceNumber,
        b.month,
        b.year,
        b.amountDue,
        b.amountPaid,
        b.status,
        format(new Date(b.dueDate), "yyyy-MM-dd"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-of-account-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outstanding Bills</h1>
          <p className="text-muted-foreground">
            {selectedContractId
              ? "Statement for selected property"
              : "Statement across all properties"}
          </p>
        </div>
        <Button onClick={handleDownload} data-testid="button-download-statement">
          <Download className="mr-2 h-4 w-4" />
          Download Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={totalOutstanding > 0 ? "border-red-200 dark:border-red-900" : ""}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${
                totalOutstanding > 0 ? "text-red-600" : "text-green-600"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                totalOutstanding > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredBills.filter((b) => b.status !== "paid").length} unpaid invoice(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(
                filteredBills.reduce((sum, b) => sum + parseFloat(b.amountPaid), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredBills.filter((b) => b.status === "paid").length} paid invoice(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(
                filteredBills.reduce((sum, b) => sum + parseFloat(b.amountDue), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredBills.length} total invoice(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statement of Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Period</TableHead>
                {!selectedContractId && <TableHead>Property</TableHead>}
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={selectedContractId ? 6 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills
                  .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                  })
                  .map((bill) => (
                    <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                      <TableCell className="font-mono text-sm">
                        {bill.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(bill.year, bill.month - 1), "MMM yyyy")}
                      </TableCell>
                      {!selectedContractId && (
                        <TableCell>{bill.property.name}</TableCell>
                      )}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(bill.amountDue))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(bill.amountPaid))}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(bill.status)} flex w-fit items-center gap-1`}>
                          {getStatusIcon(bill.status)}
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(bill.dueDate), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedContractId && rm && (
        <Card>
          <CardHeader>
            <CardTitle>Your Relationship Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(rm.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{rm.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {rm.email}
                  </span>
                  {rm.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {rm.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
