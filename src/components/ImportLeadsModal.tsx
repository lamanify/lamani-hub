import { useState, useCallback, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Download,
  ArrowRight,
  Plus,
  Info,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface ParsedData {
  headers: string[];
  rows: string[][];
  preview: Record<string, string>[];
}

interface FieldMapping {
  [csvColumn: string]: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string; data?: any }>;
  newPropertiesCreated?: number;
}

interface PropertyDefinition {
  id: string;
  key: string;
  label: string;
  data_type: string;
  show_in_list: boolean;
  is_required: boolean;
  is_sensitive: boolean;
}

interface NewProperty {
  key: string;
  label: string;
  data_type: string;
  show_in_list: boolean;
  is_required: boolean;
  is_sensitive: boolean;
  created_via?: string;
}

const CORE_CRM_FIELDS = [
  { value: "__skip__", label: "Do not import", isSpecial: true },
  { value: "__create_new__", label: "+ Create New Property", isSpecial: true },
  { value: "name", label: "Name *", required: true },
  { value: "phone", label: "Phone *", required: true },
  { value: "email", label: "Email" },
  { value: "source", label: "Source" },
  { value: "status", label: "Status" },
  { value: "consent_given", label: "Consent Given" },
];

const STATUS_OPTIONS = [
  "new_inquiry",
  "contact_attempted",
  "contacted",
  "appointment_scheduled",
  "consultation_complete",
  "treatment_in_progress",
  "inactive",
  "disqualified",
];

const SOURCE_OPTIONS = ["manual", "import", "webform", "api", "referral", "website", "social_media"];

export function ImportLeadsModal() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"upload" | "mapping" | "review" | "importing" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [defaultValues, setDefaultValues] = useState({
    source: "import",
    status: "new_inquiry",
    consent_given: false,
  });
  const [duplicateHandling, setDuplicateHandling] = useState<"skip" | "update" | "create">("skip");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Custom properties state
  const [existingProperties, setExistingProperties] = useState<PropertyDefinition[]>([]);
  const [newProperties, setNewProperties] = useState<NewProperty[]>([]);
  const [creatingPropertyFor, setCreatingPropertyFor] = useState<string | null>(null);
  const [newPropertyForm, setNewPropertyForm] = useState({
    label: "",
    key: "",
    data_type: "string",
    show_in_list: true,
    is_required: false,
    is_sensitive: false,
  });

  // Fetch existing custom properties
  useEffect(() => {
    if (open && profile?.tenant_id) {
      supabase
        .from("property_definitions")
        .select("id, key, label, data_type, show_in_list, is_required, is_sensitive")
        .eq("entity", "lead")
        .eq("tenant_id", profile.tenant_id)
        .order("label")
        .then(({ data, error }) => {
          if (!error && data) {
            setExistingProperties(data as PropertyDefinition[]);
          }
        });
    }
  }, [open, profile?.tenant_id]);

  const resetModal = () => {
    setCurrentStep("upload");
    setFile(null);
    setParsedData(null);
    setFieldMapping({});
    setResult(null);
    setNewProperties([]);
    setCreatingPropertyFor(null);
    setNewPropertyForm({
      label: "",
      key: "",
      data_type: "string",
      show_in_list: true,
      is_required: false,
      is_sensitive: false,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [".csv", ".xlsx", ".xls"];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."));

    if (!validTypes.includes(fileExtension)) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = useCallback(
    (file: File) => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

      if (fileExtension === ".csv") {
        Papa.parse(file, {
          header: false,
          complete: (results) => {
            if (results.errors.length > 0) {
              toast.error("Error parsing CSV file");
              return;
            }

            const data = results.data as string[][];
            if (data.length < 2) {
              toast.error("File must contain at least a header row and one data row");
              return;
            }

            const headers = data[0].map((h) => h?.trim() || "");
            const rows = data.slice(1).filter((row) => row.some((cell) => cell?.trim()));

            const preview = rows.slice(0, 5).map((row) => {
              const obj: Record<string, string> = {};
              headers.forEach((header, index) => {
                obj[header] = row[index]?.trim() || "";
              });
              return obj;
            });

            setParsedData({ headers, rows, preview });
            setCurrentStep("mapping");

            // Auto-map columns
            const autoMapping: FieldMapping = {};
            for (const header of headers) {
              const lowerHeader = header.toLowerCase().trim();
              if (lowerHeader.includes("name") || lowerHeader === "full name") {
                autoMapping[header] = "name";
              } else if (lowerHeader.includes("phone") || lowerHeader.includes("mobile")) {
                autoMapping[header] = "phone";
              } else if (lowerHeader.includes("email")) {
                autoMapping[header] = "email";
              } else if (lowerHeader.includes("source")) {
                autoMapping[header] = "source";
              } else if (lowerHeader.includes("status")) {
                autoMapping[header] = "status";
              } else if (lowerHeader.includes("consent")) {
                autoMapping[header] = "consent_given";
              } else {
                // Try to match with existing custom properties
                const matchingProp = existingProperties.find(
                  (prop) => prop.label.toLowerCase() === lowerHeader || prop.key === header
                );
                if (matchingProp) {
                  autoMapping[header] = `custom.${matchingProp.key}`;
                }
              }
            }
            setFieldMapping(autoMapping);
          },
          error: () => {
            toast.error("Failed to parse CSV file");
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

            if (jsonData.length < 2) {
              toast.error("File must contain at least a header row and one data row");
              return;
            }

            const headers = jsonData[0].map((h) => String(h || "").trim());
            const rows = jsonData.slice(1).filter((row) => row.some((cell) => String(cell || "").trim()));

            const preview = rows.slice(0, 5).map((row) => {
              const obj: Record<string, string> = {};
              headers.forEach((header, index) => {
                obj[header] = String(row[index] || "").trim();
              });
              return obj;
            });

            setParsedData({ headers, rows, preview });
            setCurrentStep("mapping");

            // Auto-map columns
            const autoMapping: FieldMapping = {};
            for (const header of headers) {
              const lowerHeader = header.toLowerCase().trim();
              if (lowerHeader.includes("name")) autoMapping[header] = "name";
              else if (lowerHeader.includes("phone") || lowerHeader.includes("mobile")) autoMapping[header] = "phone";
              else if (lowerHeader.includes("email")) autoMapping[header] = "email";
              else if (lowerHeader.includes("source")) autoMapping[header] = "source";
              else if (lowerHeader.includes("status")) autoMapping[header] = "status";
              else if (lowerHeader.includes("consent")) autoMapping[header] = "consent_given";
              else {
                const matchingProp = existingProperties.find(
                  (prop) => prop.label.toLowerCase() === lowerHeader || prop.key === header
                );
                if (matchingProp) {
                  autoMapping[header] = `custom.${matchingProp.key}`;
                }
              }
            }
            setFieldMapping(autoMapping);
          } catch (error) {
            toast.error("Failed to parse Excel file");
          }
        };
        reader.readAsArrayBuffer(file);
      }
    },
    [existingProperties]
  );

  const inferDataType = (csvColumn: string): string => {
    if (!parsedData) return "string";

    const lowerKey = csvColumn.toLowerCase();

    if (lowerKey.includes("email")) return "email";
    if (lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey.includes("whatsapp")) return "phone";
    if (lowerKey.includes("url") || lowerKey.includes("website") || lowerKey.includes("link")) return "url";
    if (lowerKey.includes("date") || lowerKey.includes("dob") || lowerKey.includes("birth")) return "date";

    const sampleValues = parsedData.preview.slice(0, 20).map((row) => row[csvColumn]).filter(Boolean);
    if (sampleValues.length === 0) return "string";

    const allNumbers = sampleValues.every((val) => !isNaN(Number(val)));
    if (allNumbers) return "number";

    const allBooleans = sampleValues.every((val) => ["true", "false", "yes", "no", "1", "0"].includes(val.toLowerCase()));
    if (allBooleans) return "boolean";

    return "string";
  };

  const generatePropertyKey = (label: string): string => {
    return label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_-]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 63);
  };

  const handleFieldMappingChange = (csvColumn: string, crmField: string) => {
    if (crmField === "__skip__") {
      setFieldMapping((prev) => {
        const newMapping = { ...prev };
        delete newMapping[csvColumn];
        return newMapping;
      });
    } else if (crmField === "__create_new__") {
      const inferredType = inferDataType(csvColumn);
      setCreatingPropertyFor(csvColumn);
      setNewPropertyForm({
        label: csvColumn,
        key: generatePropertyKey(csvColumn),
        data_type: inferredType,
        show_in_list: true,
        is_required: false,
        is_sensitive: false,
      });
    } else {
      setFieldMapping((prev) => ({
        ...prev,
        [csvColumn]: crmField,
      }));
    }
  };

  const handleCreateProperty = () => {
    if (!creatingPropertyFor || !newPropertyForm.label || !newPropertyForm.key) {
      toast.error("Please provide a label and key for the property");
      return;
    }

    const newProp: NewProperty = {
      ...newPropertyForm,
      created_via: "import",
    };

    setNewProperties((prev) => [...prev, newProp]);
    setFieldMapping((prev) => ({
      ...prev,
      [creatingPropertyFor]: `custom.${newProp.key}`,
    }));

    toast.success(`"${newProp.label}" will be created during import`);

    setCreatingPropertyFor(null);
    setNewPropertyForm({
      label: "",
      key: "",
      data_type: "string",
      show_in_list: true,
      is_required: false,
      is_sensitive: false,
    });
  };

  const handleCancelCreateProperty = () => {
    setCreatingPropertyFor(null);
    setNewPropertyForm({
      label: "",
      key: "",
      data_type: "string",
      show_in_list: true,
      is_required: false,
      is_sensitive: false,
    });
  };

  const validateMapping = () => {
    const mappedFields = Object.values(fieldMapping).filter((field) => field && field !== "__skip__");
    const requiredFields = CORE_CRM_FIELDS.filter((field) => field.required).map((field) => field.value);

    const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field));

    if (missingRequired.length > 0) {
      toast.error(`Please map required fields: ${missingRequired.join(", ")}`);
      return false;
    }

    return true;
  };

  const getValidationWarnings = () => {
    if (!parsedData) return [];

    const warnings: string[] = [];
    let invalidEmails = 0;
    let missingPhones = 0;

    parsedData.preview.forEach((row) => {
      const emailColumn = Object.keys(fieldMapping).find((col) => fieldMapping[col] === "email");
      const phoneColumn = Object.keys(fieldMapping).find((col) => fieldMapping[col] === "phone");

      if (emailColumn && row[emailColumn]) {
        const email = row[emailColumn];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          invalidEmails++;
        }
      }

      if (phoneColumn && !row[phoneColumn]) {
        missingPhones++;
      }
    });

    if (invalidEmails > 0) {
      warnings.push(`${invalidEmails} rows have invalid emails`);
    }
    if (missingPhones > 0) {
      warnings.push(`${missingPhones} rows missing phone numbers`);
    }

    return warnings;
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setCurrentStep("importing");
    setImporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to import leads");
        return;
      }

      const importData = {
        fieldMapping,
        rows: parsedData.rows,
        defaultValues,
        duplicateHandling,
        headers: parsedData.headers,
        newProperties: newProperties.length > 0 ? newProperties : undefined,
      };

      const response = await supabase.functions.invoke("import-leads-with-mapping", {
        body: importData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Import failed");
      }

      const result: ImportResult = response.data;
      setResult(result);
      setCurrentStep("results");

      if (result.imported > 0) {
        toast.success(`${result.imported} leads imported successfully`);
        queryClient.invalidateQueries({ queryKey: ["leads"] });
      }

      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} leads had errors`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import leads");
      console.error("Import error:", error);
      setCurrentStep("mapping");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "Name,Phone,Email,Source,Status,Consent\nAhmad bin Abdullah,+60123456789,ahmad@example.com,website,new_inquiry,true\nSarah Lee,+60178889999,sarah@example.com,referral,contacted,false";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>
              <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)
            </p>
            <p>
              <strong>Required fields:</strong> Name, Phone
            </p>
            <Button variant="link" className="p-0 h-auto font-normal text-sm" onClick={handleDownloadTemplate}>
              <Download className="h-3 w-3 mr-1" />
              Download CSV Template
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div>
        <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="min-h-[44px] cursor-pointer" />
        {file && (
          <p className="text-sm text-muted-foreground mt-2">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>
    </div>
  );

  const renderMappingStep = () => {
    if (!parsedData) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Map Your Fields</h3>
          <p className="text-sm text-muted-foreground">
            Map columns from your file to CRM fields. Create custom properties as needed.
          </p>
        </div>

        <div className="space-y-3">
          {parsedData.headers.map((header, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <Label className="font-medium">{header}</Label>
                  <p className="text-xs text-muted-foreground truncate">
                    Sample: {parsedData.preview[0]?.[header] || "N/A"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  {creatingPropertyFor === header ? (
                    <Badge variant="secondary" className="text-xs">
                      Creating property...
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select value={fieldMapping[header] || ""} onValueChange={(value) => handleFieldMappingChange(header, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {CORE_CRM_FIELDS.filter((f) => f.isSpecial).map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.value === "__create_new__" && <Plus className="h-3 w-3 inline mr-2" />}
                              {field.label}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Core Fields</div>
                          {CORE_CRM_FIELDS.filter((f) => !f.isSpecial).map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                          {existingProperties.length > 0 && (
                            <>
                              <Separator className="my-1" />
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Custom Fields</div>
                              {existingProperties.map((prop) => (
                                <SelectItem key={prop.key} value={`custom.${prop.key}`}>
                                  {prop.label}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {fieldMapping[header]?.startsWith("custom.") && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {newProperties.find((p) => `custom.${p.key}` === fieldMapping[header]) ? "New" : "Custom"}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {creatingPropertyFor === header && (
                <Card className="border-primary ml-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Create New Property
                    </CardTitle>
                    <CardDescription className="text-xs">Suggested type: {newPropertyForm.data_type}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-label" className="text-xs">
                          Property Label
                        </Label>
                        <Input
                          id="new-label"
                          value={newPropertyForm.label}
                          onChange={(e) => {
                            const label = e.target.value;
                            setNewPropertyForm((prev) => ({
                              ...prev,
                              label,
                              key: generatePropertyKey(label),
                            }));
                          }}
                          placeholder="e.g., Treatment Interest"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-key" className="text-xs">
                          Property Key
                        </Label>
                        <Input
                          id="new-key"
                          value={newPropertyForm.key}
                          onChange={(e) => setNewPropertyForm((prev) => ({ ...prev, key: e.target.value }))}
                          placeholder="e.g., treatment_interest"
                          className="h-8 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-type" className="text-xs">
                        Data Type
                      </Label>
                      <Select value={newPropertyForm.data_type} onValueChange={(value) => setNewPropertyForm((prev) => ({ ...prev, data_type: value }))}>
                        <SelectTrigger id="new-type" className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="string">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="boolean">Yes/No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox
                          checked={newPropertyForm.show_in_list}
                          onCheckedChange={(checked) => setNewPropertyForm((prev) => ({ ...prev, show_in_list: checked as boolean }))}
                        />
                        Show in list
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Checkbox
                          checked={newPropertyForm.is_sensitive}
                          onCheckedChange={(checked) => setNewPropertyForm((prev) => ({ ...prev, is_sensitive: checked as boolean }))}
                        />
                        Sensitive (PDPA)
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCreateProperty} size="sm" className="flex-1">
                        Create & Map
                      </Button>
                      <Button onClick={handleCancelCreateProperty} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>

        {newProperties.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900">New Properties to Create</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {newProperties.map((prop, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{prop.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {prop.data_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h4 className="font-medium">Default Values</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Default Source</Label>
              <Select value={defaultValues.source} onValueChange={(value) => setDefaultValues((prev) => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Status</Label>
              <Select value={defaultValues.status} onValueChange={(value) => setDefaultValues((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duplicate Handling</Label>
              <Select value={duplicateHandling} onValueChange={(value: "skip" | "update" | "create") => setDuplicateHandling(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="skip">Skip duplicates</SelectItem>
                  <SelectItem value="update">Update existing</SelectItem>
                  <SelectItem value="create">Create anyway</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setCurrentStep("upload")} variant="outline">
            Back
          </Button>
          <Button
            onClick={() => {
              if (validateMapping()) {
                setCurrentStep("review");
              }
            }}
          >
            Continue to Review
          </Button>
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    if (!parsedData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{parsedData.rows.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fields Mapped</p>
                <p className="text-2xl font-bold">{Object.values(fieldMapping).filter((f) => f && f !== "__skip__").length}</p>
              </div>
            </div>

            {newProperties.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">New Custom Properties</p>
                <div className="space-y-1">
                  {newProperties.map((prop, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        New
                      </Badge>
                      <span className="font-medium">{prop.label}</span>
                      <span className="text-muted-foreground">({prop.data_type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Duplicate Handling</p>
              <Badge variant="outline">
                {duplicateHandling === "skip" && "Skip duplicates"}
                {duplicateHandling === "update" && "Update existing"}
                {duplicateHandling === "create" && "Create anyway"}
              </Badge>
            </div>

            {getValidationWarnings().length > 0 && (
              <>
                <Separator />
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">Data Validation Warnings:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {getValidationWarnings().map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Preview (First 5 Rows)</h3>
          <div className="border rounded-lg overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.entries(fieldMapping)
                    .filter(([_, field]) => field && field !== "__skip__")
                    .map(([csvCol, crmField], index) => {
                      const isCustom = crmField.startsWith("custom.");
                      const isNew = newProperties.some((p) => `custom.${p.key}` === crmField);
                      const label = isCustom
                        ? newProperties.find((p) => `custom.${p.key}` === crmField)?.label || existingProperties.find((p) => `custom.${p.key}` === crmField)?.label || crmField.replace("custom.", "")
                        : CORE_CRM_FIELDS.find((f) => f.value === crmField)?.label || crmField;

                      return (
                        <TableHead key={index}>
                          <div className="flex items-center gap-2">
                            {label}
                            {isNew && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                New
                              </Badge>
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.preview.slice(0, 5).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Object.entries(fieldMapping)
                      .filter(([_, field]) => field && field !== "__skip__")
                      .map(([csvCol], cellIndex) => (
                        <TableCell key={cellIndex}>{row[csvCol] || "-"}</TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setCurrentStep("mapping")} variant="outline">
            Back to Mapping
          </Button>
          <Button onClick={handleImport} className="flex-1">
            Start Import
          </Button>
        </div>
      </div>
    );
  };

  const renderResultsStep = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Import Complete</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{result.imported}</div>
            <div className="text-sm text-green-700">Imported</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
            <div className="text-sm text-yellow-700">Skipped</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
            <div className="text-sm text-red-700">Errors</div>
          </div>
        </div>

        {result.newPropertiesCreated && result.newPropertiesCreated > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Custom Properties Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {result.newPropertiesCreated} new custom {result.newPropertiesCreated === 1 ? "property" : "properties"} created successfully.
              </p>
              {newProperties.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newProperties.map((prop, idx) => (
                    <div key={idx} className="text-sm flex items-center gap-2">
                      <span className="font-medium">{prop.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {prop.data_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {result.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Errors encountered:</strong>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 10).map((error, idx) => (
                  <li key={idx} className="text-sm">
                    Row {error.row}: {error.reason}
                  </li>
                ))}
                {result.errors.length > 10 && <li className="text-sm font-semibold">... and {result.errors.length - 10} more errors</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-900">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Button
              variant="link"
              className="h-auto p-0 text-blue-700"
              onClick={() => {
                setOpen(false);
              }}
            >
              → View imported leads
            </Button>
            {result.newPropertiesCreated && result.newPropertiesCreated > 0 && (
              <div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-blue-700"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/settings/fields";
                  }}
                >
                  → Manage custom fields
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={resetModal} variant="outline" className="flex-1">
            Import Another File
          </Button>
          <Button onClick={() => setOpen(false)} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetModal();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-[44px]">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Import Leads
            {currentStep === "mapping" && " - Map Fields"}
            {currentStep === "review" && " - Review"}
            {currentStep === "importing" && " - Importing..."}
            {currentStep === "results" && " - Results"}
          </DialogTitle>
        </DialogHeader>

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "mapping" && renderMappingStep()}
        {currentStep === "review" && renderReviewStep()}
        {currentStep === "importing" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Importing leads...</p>
          </div>
        )}
        {currentStep === "results" && renderResultsStep()}
      </DialogContent>
    </Dialog>
  );
}
