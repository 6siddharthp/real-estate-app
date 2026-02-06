import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContract } from "@/lib/contract-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Download, Eye, Search, FileText, File } from "lucide-react";
import { format } from "date-fns";
import type { DocumentWithContract } from "@shared/schema";

const documentCategories = [
  { value: "all", label: "All Categories" },
  { value: "contract_letter", label: "Contract Letters" },
  { value: "lease_deed", label: "Lease Deed" },
  { value: "lessor_kyc", label: "Lessor KYC" },
  { value: "noc", label: "NOC" },
  { value: "occupancy_certificate", label: "Occupancy Certificate" },
  { value: "utility_invoice", label: "Utility Invoices" },
  { value: "rent_invoice", label: "Rent Invoices" },
  { value: "other", label: "Other" },
];

export default function CustomerDocuments() {
  const { selectedContractId } = useContract();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: documents = [], isLoading } = useQuery<DocumentWithContract[]>({
    queryKey: ["/api/customer/documents"],
  });

  const filteredDocuments = documents
    .filter((doc) => {
      if (selectedContractId && doc.contractId !== selectedContractId) return false;
      if (categoryFilter !== "all" && doc.category !== categoryFilter) return false;
      if (
        searchQuery &&
        !doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const getCategoryLabel = (category: string) => {
    return (
      documentCategories.find((c) => c.value === category)?.label ||
      category.replace(/_/g, " ")
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "contract_letter":
      case "lease_deed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "lessor_kyc":
      case "noc":
      case "occupancy_certificate":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "utility_invoice":
      case "rent_invoice":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground">
          {selectedContractId
            ? "Documents for selected property"
            : "Documents across all properties"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-documents"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-document-category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {documentCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
            <Badge variant="secondary" className="ml-2">
              {filteredDocuments.length} document(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Category</TableHead>
                {!selectedContractId && <TableHead>Property</TableHead>}
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={selectedContractId ? 4 : 5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <File className="h-8 w-8" />
                      <span>No documents found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-document-${doc.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(doc.category)}>
                        {getCategoryLabel(doc.category)}
                      </Badge>
                    </TableCell>
                    {!selectedContractId && (
                      <TableCell>{doc.property.name}</TableCell>
                    )}
                    <TableCell>
                      {format(new Date(doc.uploadedAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                          data-testid={`button-view-${doc.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = doc.fileUrl;
                            a.download = doc.name;
                            a.click();
                          }}
                          data-testid={`button-download-${doc.id}`}
                        >
                          <Download className="h-4 w-4" />
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
