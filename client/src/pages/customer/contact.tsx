import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useContract } from "@/lib/contract-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone,
  Mail,
  Building,
  Send,
  Loader2,
  User,
  Headphones,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Car,
  FileText,
  Wrench,
  Key,
  HelpCircle,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import type { ContractWithDetails, ServiceRequest, User as UserType } from "@shared/schema";

const serviceRequestTypes = [
  { value: "document_request", label: "Document Request" },
  { value: "billing_clarification", label: "Billing Clarification" },
  { value: "credit_request", label: "Credit Request" },
  { value: "parking_statement", label: "Parking Statement" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

interface ServiceRequestTemplate {
  id: string;
  title: string;
  description: string;
  icon: typeof CreditCard;
  type: string;
  subject: string;
  descriptionTemplate: string;
}

const serviceRequestTemplates: ServiceRequestTemplate[] = [
  {
    id: "credit_additional_payment",
    title: "Request Credit for Additional Payment",
    description: "Made an extra payment? Request credit to your account.",
    icon: CreditCard,
    type: "credit_request",
    subject: "Credit Request for Additional Payment",
    descriptionTemplate: "I have made an additional payment towards my rent/billing and would like to request a credit adjustment to my account. Please find the payment details below:\n\nPayment Date: [Enter date]\nPayment Amount: [Enter amount]\nPayment Reference/Transaction ID: [Enter reference]\n\nPlease adjust my account balance accordingly.",
  },
  {
    id: "parking_statement",
    title: "Parking Statement of Account",
    description: "Request detailed parking charges and payment history.",
    icon: Car,
    type: "parking_statement",
    subject: "Request for Parking Statement of Account",
    descriptionTemplate: "I would like to request a detailed statement of account for my parking charges. Please provide:\n\n- Monthly parking charges\n- Payment history\n- Any outstanding dues\n- Allocated parking slot details\n\nKindly share the statement for the current financial year.",
  },
  {
    id: "rent_receipt",
    title: "Rent Receipt Request",
    description: "Request official rent receipts for tax purposes.",
    icon: Receipt,
    type: "document_request",
    subject: "Request for Rent Receipts",
    descriptionTemplate: "I require official rent receipts for income tax filing purposes. Please provide rent receipts for the following period:\n\nFrom: [Start Month/Year]\nTo: [End Month/Year]\n\nPlease include the landlord's PAN number on the receipts as per IT regulations.",
  },
  {
    id: "lease_renewal",
    title: "Lease Renewal Inquiry",
    description: "Inquire about lease renewal terms and process.",
    icon: FileText,
    type: "other",
    subject: "Inquiry Regarding Lease Renewal",
    descriptionTemplate: "My current lease is approaching its renewal date and I would like to discuss the renewal terms. Please provide:\n\n- Proposed rent for the renewal period\n- Any changes to terms and conditions\n- Documents required for renewal\n- Timeline for completing the renewal process\n\nI am interested in continuing the lease and would appreciate an early discussion.",
  },
  {
    id: "maintenance_ac",
    title: "AC/HVAC Maintenance",
    description: "Report AC or heating/cooling system issues.",
    icon: Wrench,
    type: "maintenance",
    subject: "AC/HVAC Maintenance Request",
    descriptionTemplate: "I am experiencing issues with the air conditioning/HVAC system in my premises. Details:\n\nIssue Type: [Not cooling/Not heating/Strange noise/Leaking/Other]\nLocation: [Specific area in the premises]\nWhen did the issue start: [Date]\n\nPlease arrange for a technician visit at the earliest convenience. Preferred time slot: [Morning/Afternoon/Evening]",
  },
  {
    id: "maintenance_electrical",
    title: "Electrical Issue",
    description: "Report electrical problems or power issues.",
    icon: Wrench,
    type: "maintenance",
    subject: "Electrical Maintenance Request",
    descriptionTemplate: "I need to report an electrical issue in my premises:\n\nIssue: [Power outage/Socket not working/Light fixture issue/Tripping/Other]\nLocation: [Specific area]\nUrgency: [Normal/Urgent/Emergency]\n\nPlease arrange for an electrician to inspect and resolve the issue.",
  },
  {
    id: "duplicate_key",
    title: "Duplicate Key Request",
    description: "Request additional keys for your premises.",
    icon: Key,
    type: "other",
    subject: "Request for Duplicate Keys",
    descriptionTemplate: "I would like to request duplicate keys for my premises:\n\nNumber of duplicate keys required: [Enter number]\nReason: [Lost key/Additional family member/Staff access/Backup]\n\nPlease let me know the process and any charges applicable for getting duplicate keys.",
  },
  {
    id: "billing_dispute",
    title: "Billing Dispute",
    description: "Raise a concern about incorrect billing.",
    icon: HelpCircle,
    type: "billing_clarification",
    subject: "Billing Clarification - Dispute",
    descriptionTemplate: "I have noticed a discrepancy in my recent bill and would like clarification:\n\nInvoice Number: [Enter invoice number]\nBilled Amount: [Enter amount]\nExpected Amount: [Enter expected amount]\nNature of Dispute: [Overcharge/Duplicate charge/Wrong calculation/Other]\n\nPlease review and provide a detailed breakdown of the charges.",
  },
];

const serviceRequestSchema = z.object({
  contractId: z.string().min(1, "Please select a property"),
  type: z.string().min(1, "Please select a request type"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

export default function CustomerContact() {
  const { selectedContractId } = useContract();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: contracts = [] } = useQuery<ContractWithDetails[]>({
    queryKey: ["/api/customer/contracts"],
  });

  const { data: rm } = useQuery<UserType>({
    queryKey: ["/api/customer/rm", selectedContractId],
    enabled: !!selectedContractId,
  });

  const { data: serviceRequests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/customer/service-requests"],
  });

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      contractId: selectedContractId || "",
      type: "",
      subject: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      await apiRequest("POST", "/api/customer/service-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-requests"] });
      form.reset();
      setSelectedTemplate(null);
      toast({
        title: "Request submitted",
        description: "Your service request has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceRequestFormData) => {
    createMutation.mutate(data);
  };

  const handleTemplateSelect = (template: ServiceRequestTemplate) => {
    setSelectedTemplate(template.id);
    form.setValue("type", template.type);
    form.setValue("subject", template.subject);
    form.setValue("description", template.descriptionTemplate);
    if (selectedContractId) {
      form.setValue("contractId", selectedContractId);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>
        <p className="text-muted-foreground">
          Get in touch with your relationship manager or submit a service request
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Relationship Manager
              </CardTitle>
              <CardDescription>
                {selectedContractId
                  ? "Contact for your selected property"
                  : "Select a property to see your RM"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rm ? (
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(rm.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{rm.name}</h3>
                    <div className="space-y-1 text-sm">
                      <a
                        href={`mailto:${rm.email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        data-testid="link-rm-email"
                      >
                        <Mail className="h-4 w-4" />
                        {rm.email}
                      </a>
                      {rm.phone && (
                        <a
                          href={`tel:${rm.phone}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                          data-testid="link-rm-phone"
                        >
                          <Phone className="h-4 w-4" />
                          {rm.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a property to see your relationship manager</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                ABC Helpdesk
              </CardTitle>
              <CardDescription>General support contact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href="tel:+911800123456"
                      className="font-medium hover:text-primary transition-colors"
                      data-testid="link-helpdesk-phone"
                    >
                      1800-123-456
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href="mailto:support@abcrealestate.com"
                      className="font-medium hover:text-primary transition-colors"
                      data-testid="link-helpdesk-email"
                    >
                      support@abcrealestate.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Office Hours</p>
                    <p className="font-medium">Mon - Sat, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Service Request
            </CardTitle>
            <CardDescription>
              Submit a request and our team will get back to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="contractId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property / Contract</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-service-contract">
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.property.name} - {contract.leaseNumber}
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-service-type">
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceRequestTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief subject of your request"
                          data-testid="input-service-subject"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your request in detail"
                          className="min-h-[100px]"
                          data-testid="input-service-description"
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
                  data-testid="button-submit-service-request"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Request Templates</CardTitle>
          <CardDescription>
            Select a common request type to quickly fill out the form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {serviceRequestTemplates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all hover-elevate ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid={`template-${template.id}`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{template.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary mt-auto">
                    Use template <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No service requests yet
                  </TableCell>
                </TableRow>
              ) : (
                serviceRequests.map((request) => (
                  <TableRow key={request.id} data-testid={`row-service-request-${request.id}`}>
                    <TableCell className="font-medium">{request.subject}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {request.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(request.status)} flex w-fit items-center gap-1`}>
                        {getStatusIcon(request.status)}
                        {request.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.updatedAt), "dd MMM yyyy")}
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
