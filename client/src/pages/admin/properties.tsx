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
import { Textarea } from "@/components/ui/textarea";
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
import { Building, Home, Plus, Loader2, Pencil, Download, Upload, Trash2 } from "lucide-react";
import type { Property } from "@shared/schema";

const propertySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["retail", "residential"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  description: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function AdminProperties() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/admin/properties"],
  });

  const createForm = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      type: "retail",
      address: "",
      city: "",
      description: "",
    },
  });

  const editForm = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      type: "retail",
      address: "",
      city: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      await apiRequest("POST", "/api/admin/properties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      createForm.reset();
      setCreateOpen(false);
      toast({
        title: "Property created",
        description: "The property has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyFormData }) => {
      await apiRequest("PUT", `/api/admin/properties/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      editForm.reset();
      setEditOpen(false);
      setEditingProperty(null);
      toast({
        title: "Property updated",
        description: "The property has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (propertiesData: any[]) => {
      await apiRequest("POST", "/api/admin/properties/bulk", { properties: propertiesData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      toast({
        title: "Import successful",
        description: "Properties have been imported successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import properties",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/properties"] });
      toast({
        title: "Property deleted",
        description: "The property has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete property",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (property: Property) => {
    if (confirm(`Are you sure you want to delete "${property.name}"?`)) {
      deleteMutation.mutate(property.id);
    }
  };

  const onCreateSubmit = (data: PropertyFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: PropertyFormData) => {
    if (editingProperty) {
      editMutation.mutate({ id: editingProperty.id, data });
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    editForm.reset({
      name: property.name,
      type: property.type as "retail" | "residential",
      address: property.address,
      city: property.city,
      description: property.description || "",
    });
    setEditOpen(true);
  };

  const handleExportTemplate = () => {
    const headers = ["name", "type", "address", "city", "description"];
    const sampleData = [
      ["Phoenix MarketCity - Shop G-15", "retail", "LBS Marg, Kurla West", "Mumbai", "Ground floor retail space"],
    ];
    const csvContent = [headers.join(","), ...sampleData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "properties_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    const headers = ["id", "name", "type", "address", "city", "description"];
    const csvContent = [
      headers.join(","),
      ...properties.map(p => [
        p.id,
        `"${p.name}"`,
        p.type,
        `"${p.address}"`,
        p.city,
        `"${p.description || ""}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "properties_export.csv";
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
      
      const propertiesData = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, "")) || [];
        const property: Record<string, string> = {};
        headers.forEach((header, index) => {
          property[header] = values[index] || "";
        });
        return property;
      });

      bulkImportMutation.mutate(propertiesData);
    };
    reader.readAsText(file);
    event.target.value = "";
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building className="h-6 w-6" />
            Properties
          </h1>
          <p className="text-muted-foreground">
            All properties in the system ({properties.length})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportTemplate} data-testid="button-export-template">
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={bulkImportMutation.isPending} data-testid="button-import">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-property">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Phoenix MarketCity - Shop G-15" data-testid="input-property-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="residential">Residential</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="LBS Marg, Kurla West" data-testid="input-property-address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Mumbai" data-testid="input-property-city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ground floor retail space" data-testid="input-property-description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-property">
                    {createMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>) : "Add Property"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Phoenix MarketCity - Shop G-15" data-testid="input-edit-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="LBS Marg, Kurla West" data-testid="input-edit-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Mumbai" data-testid="input-edit-city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ground floor retail space" data-testid="input-edit-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={editMutation.isPending} data-testid="button-save-property">
                {editMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No properties found
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id} data-testid={`row-property-${property.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {property.type === "retail" ? (
                          <Building className="h-4 w-4 text-primary" />
                        ) : (
                          <Home className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium">{property.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {property.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{property.address}</TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(property)} data-testid={`button-edit-property-${property.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(property)} data-testid={`button-delete-property-${property.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
