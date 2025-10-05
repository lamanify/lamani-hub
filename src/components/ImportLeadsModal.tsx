import { Upload, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export function ImportLeadsModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Phone,Email,Source,Consent\nAhmad bin Abdullah,012-345 6789,ahmad@example.com,website,true\nSarah Lee,017-888 9999,sarah@example.com,referral,false';
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

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to import leads');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const { data: { supabase_url } } = await supabase.functions.invoke('import-leads', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const data: ImportResult = await response.json();
      setResult(data);

      if (data.imported > 0) {
        toast.success(`${data.imported} leads imported successfully`);
        // Refresh leads list
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }

      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} leads skipped due to errors`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import leads. Please try again.');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>CSV Format:</strong> Your file must have columns: Name, Phone, Email</p>
                <p className="text-sm"><strong>Example:</strong> Ahmad bin Abdullah, 012-345 6789, ahmad@example.com</p>
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

          {/* File input */}
          <div>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Import result */}
          {result && (
            <div className="space-y-3">
              {result.imported > 0 && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription>
                    <strong>{result.imported} leads imported successfully</strong>
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{result.errors.length} leads skipped:</strong>
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
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? 'Importing...' : 'Import Leads'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
