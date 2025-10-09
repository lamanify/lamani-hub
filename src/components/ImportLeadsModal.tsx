import { Upload, AlertCircle, CheckCircle, X, Download, FileText, ArrowRight, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ParsedData {
  headers: string[];
  rows: string[][];
  preview: Record<string, string>[];
}

interface FieldMapping {
  [csvColumn: string]: string; // Maps CSV column to CRM field
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string; data?: any }>;
}

const CRM_FIELDS = [
  { value: '', label: 'Do not import' },
  { value: 'name', label: 'Name *', required: true },
  { value: 'phone', label: 'Phone *', required: true },
  { value: 'email', label: 'Email' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'consent_given', label: 'Consent Given' },
  { value: 'notes', label: 'Notes' },
];

const STATUS_OPTIONS = [
  'new_inquiry',
  'contact_attempted',
  'contacted',
  'appointment_scheduled',
  'consultation_complete',
  'treatment_in_progress',
  'inactive',
  'disqualified'
];

const SOURCE_OPTIONS = ['manual', 'import', 'webform', 'api', 'referral', 'website', 'social_media'];

export function ImportLeadsModal() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [defaultValues, setDefaultValues] = useState({
    source: 'import',
    status: 'new_inquiry',
    consent_given: false
  });
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create'>('skip');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const resetModal = () => {
    setCurrentStep('upload');
    setFile(null);
    setParsedData(null);
    setFieldMapping({});
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = useCallback((file: File) => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (fileExtension === '.csv') {
      // Parse CSV
      Papa.parse(file, {
        header: false,
        complete: (results) => {
          if (results.errors.length > 0) {
            toast.error('Error parsing CSV file');
            return;
          }
          
          const data = results.data as string[][];
          if (data.length < 2) {
            toast.error('File must contain at least a header row and one data row');
            return;
          }
          
          const headers = data[0].map(h => h?.trim() || '');
          const rows = data.slice(1).filter(row => row.some(cell => cell?.trim()));
          
          const preview = rows.slice(0, 5).map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
              obj[header] = row[index]?.trim() || '';
            });
            return obj;
          });
          
          setParsedData({ headers, rows, preview });
          setCurrentStep('mapping');
          
          // Auto-map common columns
          const autoMapping: FieldMapping = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('name')) autoMapping[header] = 'name';
            else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) autoMapping[header] = 'phone';
            else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
            else if (lowerHeader.includes('source')) autoMapping[header] = 'source';
            else if (lowerHeader.includes('status')) autoMapping[header] = 'status';
            else if (lowerHeader.includes('consent')) autoMapping[header] = 'consent_given';
            else if (lowerHeader.includes('note')) autoMapping[header] = 'notes';
          });
          setFieldMapping(autoMapping);
        },
        error: () => {
          toast.error('Failed to parse CSV file');
        }
      });
    } else {
      // Parse Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          if (jsonData.length < 2) {
            toast.error('File must contain at least a header row and one data row');
            return;
          }
          
          const headers = jsonData[0].map(h => String(h || '').trim());
          const rows = jsonData.slice(1).filter(row => row.some(cell => String(cell || '').trim()));
          
          const preview = rows.slice(0, 5).map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
              obj[header] = String(row[index] || '').trim();
            });
            return obj;
          });
          
          setParsedData({ headers, rows, preview });
          setCurrentStep('mapping');
          
          // Auto-map common columns
          const autoMapping: FieldMapping = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('name')) autoMapping[header] = 'name';
            else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) autoMapping[header] = 'phone';
            else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
            else if (lowerHeader.includes('source')) autoMapping[header] = 'source';
            else if (lowerHeader.includes('status')) autoMapping[header] = 'status';
            else if (lowerHeader.includes('consent')) autoMapping[header] = 'consent_given';
            else if (lowerHeader.includes('note')) autoMapping[header] = 'notes';
          });
          setFieldMapping(autoMapping);
        } catch (error) {
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const handleFieldMappingChange = (csvColumn: string, crmField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvColumn]: crmField
    }));
  };

  const validateMapping = () => {
    const mappedFields = Object.values(fieldMapping).filter(field => field);
    const requiredFields = CRM_FIELDS.filter(field => field.required).map(field => field.value);
    
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingRequired.length > 0) {
      toast.error(`Please map required fields: ${missingRequired.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleImport = async () => {
    if (!parsedData || !validateMapping()) return;
    
    setCurrentStep('importing');
    setImporting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to import leads');
        return;
      }
      
      // Prepare data for import
      const importData = {
        fieldMapping,
        rows: parsedData.rows,
        defaultValues,
        duplicateHandling,
        headers: parsedData.headers
      };
      
      const response = await supabase.functions.invoke('import-leads-with-mapping', {
        body: importData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Import failed');
      }
      
      const result: ImportResult = response.data;
      setResult(result);
      setCurrentStep('results');
      
      if (result.imported > 0) {
        toast.success(`${result.imported} leads imported successfully`);
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }
      
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} leads had errors`);
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to import leads');
      console.error('Import error:', error);
      setCurrentStep('mapping');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Phone,Email,Source,Status,Consent\nAhmad bin Abdullah,+60123456789,ahmad@example.com,website,new_inquiry,true\nSarah Lee,+60178889999,sarah@example.com,referral,contacted,false';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)</p>
            <p><strong>Required fields:</strong> Name, Phone</p>
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-3 w-3 mr-1" />
              Download CSV Template
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div>
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="min-h-[44px] cursor-pointer"
        />
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
            Map columns from your file to CRM fields. Required fields are marked with *
          </p>
        </div>
        
        {/* Field Mapping */}
        <div className="space-y-3">
          {parsedData.headers.map((header, index) => (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="font-medium">{header}</Label>
                <p className="text-xs text-muted-foreground truncate">
                  Sample: {parsedData.preview[0]?.[header] || 'N/A'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Select
                  value={fieldMapping[header] || ''}
                  onValueChange={(value) => handleFieldMappingChange(header, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
        
        {/* Default Values */}
        <div className="space-y-4">
          <h4 className="font-medium">Default Values</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Default Source</Label>
              <Select value={defaultValues.source} onValueChange={(value) => setDefaultValues(prev => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Status</Label>
              <Select value={defaultValues.status} onValueChange={(value) => setDefaultValues(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duplicate Handling</Label>
              <Select value={duplicateHandling} onValueChange={(value: 'skip' | 'update' | 'create') => setDuplicateHandling(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip duplicates</SelectItem>
                  <SelectItem value="update">Update existing</SelectItem>
                  <SelectItem value="create">Create anyway</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div>
          <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.values(fieldMapping).filter(field => field).map((field, index) => (
                    <TableHead key={index}>{CRM_FIELDS.find(f => f.value === field)?.label || field}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.preview.map((row, index) => (
                  <TableRow key={index}>
                    {Object.entries(fieldMapping).filter(([_, field]) => field).map(([csvCol, crmField], cellIndex) => (
                      <TableCell key={cellIndex}>
                        {row[csvCol] || (crmField ? defaultValues[crmField as keyof typeof defaultValues] : '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep('upload')}>Back</Button>
          <Button onClick={handleImport}>Import {parsedData.rows.length} Leads</Button>
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
        
        {result.errors.length > 0 && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              <strong>Errors encountered:</strong>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 10).map((error, idx) => (
                  <li key={idx} className="text-sm">
                    Row {error.row}: {error.reason}
                  </li>
                ))}
                {result.errors.length > 10 && (
                  <li className="text-sm font-semibold">... and {result.errors.length - 10} more errors</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-center">
          <Button onClick={() => { resetModal(); setOpen(false); }}>Done</Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetModal(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-[44px]">
          <Upload className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Import</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Import Leads
            {currentStep === 'mapping' && ' - Map Fields'}
            {currentStep === 'importing' && ' - Importing...'}
            {currentStep === 'results' && ' - Results'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'mapping' && renderMappingStep()}
        {currentStep === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Importing leads...</p>
          </div>
        )}
        {currentStep === 'results' && renderResultsStep()}
      </DialogContent>
    </Dialog>
  );
}