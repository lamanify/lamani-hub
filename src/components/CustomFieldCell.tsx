import { Check, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface CustomFieldCellProps {
  value: any;
  dataType: string;
}

export function CustomFieldCell({ value, dataType }: CustomFieldCellProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  switch (dataType) {
    case "date":
      try {
        return <span className="text-sm">{format(new Date(value), "MMM dd, yyyy")}</span>;
      } catch {
        return <span className="text-sm">{String(value)}</span>;
      }

    case "number":
      return <span className="text-sm font-mono">{Number(value).toLocaleString()}</span>;

    case "boolean":
      return value === true || value === "true" ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      );

    case "email":
      return (
        <a
          href={`mailto:${value}`}
          className="text-sm text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );

    case "phone":
      const cleanPhone = String(value).replace(/\D/g, "");
      return (
        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );

    case "url":
      const displayUrl = String(value).length > 30 ? String(value).substring(0, 30) + "..." : value;
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {displayUrl}
          <ExternalLink className="h-3 w-3" />
        </a>
      );

    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}
