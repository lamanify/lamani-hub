import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { FileText, Download, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Invoice {
  id: string;
  number: string;
  date: number;
  amount_paid: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoice_pdf: string;
  hosted_invoice_url: string;
}

export const InvoiceHistory = () => {
  const { handleAuthError } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }

        const { data, error: invoiceError } = await supabase.functions.invoke("get-invoices", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (invoiceError) {
          throw invoiceError;
        }

        setInvoices(data.invoices || []);
      } catch (err: any) {
        console.error("Error fetching invoices:", err);
        await handleAuthError(err);
        setError(err.message || "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'open':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case 'void':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Void
          </Badge>
        );
      case 'uncollectible':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Uncollectible
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No invoices yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your invoices will appear here after your first payment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground">
                  {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                </p>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(invoice.date * 1000), 'MMM dd, yyyy')} • {formatAmount(invoice.amount_paid, invoice.currency)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="ml-4"
          >
            <a
              href={invoice.invoice_pdf}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
};
