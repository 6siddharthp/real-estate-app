import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
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
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
  BrainCircuit,
} from "lucide-react";
import { format } from "date-fns";
import type { ServiceRequestWithDetails } from "@shared/schema";

export default function RMServiceRequests() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestWithDetails | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [rmNote, setRmNote] = useState("");

  const { data: requests = [], isLoading } = useQuery<ServiceRequestWithDetails[]>({
    queryKey: ["/api/rm/service-requests"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      rmNote,
    }: {
      id: string;
      status: string;
      rmNote?: string;
    }) => {
      await apiRequest("PATCH", `/api/rm/service-requests/${id}`, { status, rmNote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rm/service-requests"] });
      setSelectedRequest(null);
      setNewStatus("");
      setRmNote("");
      toast({
        title: "Request updated",
        description: "The service request has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleUpdate = () => {
    if (selectedRequest && newStatus) {
      updateMutation.mutate({
        id: selectedRequest.id,
        status: newStatus,
        rmNote: rmNote || undefined,
      });
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
            <ClipboardList className="h-6 w-6" />
            Service Requests
          </h1>
          <p className="text-muted-foreground">
            Manage customer service requests
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No service requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                    <TableCell className="font-medium">
                      {request.customer.name}
                    </TableCell>
                    <TableCell>{request.property.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {request.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.subject}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(request.status)} flex w-fit items-center gap-1`}>
                        {getStatusIcon(request.status)}
                        {request.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(request as any).mlAssigned ? (
                        <Badge variant="outline" className="flex w-fit items-center gap-1" data-testid={`badge-ml-assigned-${request.id}`}>
                          <BrainCircuit className="h-3 w-3" />
                          ML
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contract RM</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setNewStatus(request.status);
                          setRmNote(request.rmNote || "");
                        }}
                        data-testid={`button-update-${request.id}`}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Service Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Subject
                </h4>
                <p className="font-medium">{selectedRequest.subject}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Update Status
                </h4>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Add Note (Optional)
                </h4>
                <Textarea
                  value={rmNote}
                  onChange={(e) => setRmNote(e.target.value)}
                  placeholder="Add a note about this request..."
                  data-testid="input-rm-note"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-save-update"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
