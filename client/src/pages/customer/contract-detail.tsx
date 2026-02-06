import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building,
  Home,
  Square,
  IndianRupee,
  Shield,
  Calendar,
  TrendingUp,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
} from "lucide-react";
import { format, differenceInDays, differenceInCalendarDays } from "date-fns";
import type { ContractWithDetails } from "@shared/schema";

function LeaseTimeline({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDays = differenceInCalendarDays(end, start);
  const elapsedDays = differenceInCalendarDays(today, start);
  const remainingDays = differenceInCalendarDays(end, today);

  const progressPercent = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
  const todayPercent = progressPercent;

  const isExpired = remainingDays < 0;
  const isNearExpiry = remainingDays >= 0 && remainingDays <= 90;

  const totalMonths = Math.round(totalDays / 30.44);
  const elapsedMonths = Math.max(0, Math.round(elapsedDays / 30.44));
  const remainingMonths = Math.max(0, Math.round(remainingDays / 30.44));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Lease Start</p>
          <p className="text-sm font-semibold">{format(start, "dd MMM yyyy")}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Today</p>
          <p className="text-sm font-semibold">{format(today, "dd MMM yyyy")}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Lease End</p>
          <p className="text-sm font-semibold">{format(end, "dd MMM yyyy")}</p>
        </div>
      </div>

      <div className="relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isExpired
                ? "bg-destructive"
                : isNearExpiry
                ? "bg-yellow-500"
                : "bg-primary"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {!isExpired && todayPercent > 0 && todayPercent < 100 && (
          <div
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${todayPercent}%` }}
          >
            <div className={`w-0.5 h-5 mx-auto -mt-1 ${
              isNearExpiry ? "bg-yellow-600" : "bg-primary"
            }`} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">{totalMonths}</p>
          <p className="text-xs text-muted-foreground">Total Months</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{elapsedMonths}</p>
          <p className="text-xs text-muted-foreground">Months Elapsed</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${
            isExpired
              ? "text-destructive"
              : isNearExpiry
              ? "text-yellow-600"
              : "text-foreground"
          }`}>
            {isExpired ? 0 : remainingDays}
          </p>
          <p className="text-xs text-muted-foreground">
            {isExpired ? "Expired" : "Days Remaining"}
          </p>
        </div>
      </div>

      {isExpired && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-center text-sm font-medium">
          This lease expired {Math.abs(remainingDays)} days ago
        </div>
      )}
      {isNearExpiry && (
        <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md p-3 text-center text-sm font-medium">
          Lease expires in {remainingDays} days - renewal may be needed soon
        </div>
      )}
    </div>
  );
}

export default function ContractDetail() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;

  const { data: contracts = [], isLoading } = useQuery<ContractWithDetails[]>({
    queryKey: ["/api/customer/contracts"],
  });

  const contract = contracts.find((c) => c.id === contractId);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4">
        <Link href="/customer/dashboard">
          <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Contract not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/customer/dashboard">
          <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-contract-title">
              {contract.property.name}
            </h1>
            <Badge className={getStatusColor(contract.status)} data-testid="badge-contract-status">
              {contract.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-lease-number">
            Lease #{contract.leaseNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Area</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sqft">
              {contract.sqft.toLocaleString()} sq.ft
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rent</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-rent">
              {formatCurrency(parseFloat(contract.rentPerMonth))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Deposit</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-deposit">
              {formatCurrency(parseFloat(contract.securityDeposit))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rent Uplift</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-uplift">
              {contract.rentUpliftPercent ? `${contract.rentUpliftPercent}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contract.rentUpliftClause || "No clause specified"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lease Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaseTimeline startDate={contract.startDate} endDate={contract.endDate} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {contract.property.type === "retail" ? (
                <Building className="h-5 w-5" />
              ) : (
                <Home className="h-5 w-5" />
              )}
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Property Name</p>
                <p className="font-medium" data-testid="text-property-name">{contract.property.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline" className="capitalize mt-0.5">{contract.property.type}</Badge>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium" data-testid="text-property-address">{contract.property.address}</p>
                <p className="text-sm text-muted-foreground">{contract.property.city}</p>
              </div>
            </div>
            {contract.property.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{contract.property.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Relationship Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract.rm ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium" data-testid="text-rm-name">{contract.rm.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium" data-testid="text-rm-email">{contract.rm.email}</p>
                  </div>
                </div>
                {contract.rm.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium" data-testid="text-rm-phone">{contract.rm.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <User className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm">No RM assigned to this contract</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lease Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Lease Number</p>
              <p className="font-mono font-medium" data-testid="text-detail-lease-number">{contract.leaseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(contract.startDate), "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(contract.endDate), "dd MMM yyyy")}</p>
            </div>
            {contract.renewalDate && (
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="font-medium">{format(new Date(contract.renewalDate), "dd MMM yyyy")}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`${getStatusColor(contract.status)} capitalize mt-0.5`}>
                {contract.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Lease Duration</p>
              <p className="font-medium">
                {Math.round(differenceInDays(new Date(contract.endDate), new Date(contract.startDate)) / 30.44)} months
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
