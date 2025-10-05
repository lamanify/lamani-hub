import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  onClick?: () => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  new_inquiry: { 
    label: "New Inquiry", 
    variant: "default",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-200"
  },
  contacted: { 
    label: "Contacted", 
    variant: "secondary",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-200"
  },
  qualified: { 
    label: "Qualified", 
    variant: "default",
    className: "bg-green-100 text-green-800 hover:bg-green-200"
  },
  converted: { 
    label: "Converted", 
    variant: "default",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
  },
  lost: { 
    label: "Lost", 
    variant: "destructive",
    className: "bg-red-100 text-red-800 hover:bg-red-200"
  },
};

export function StatusBadge({ status, onClick, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new_inquiry;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "cursor-pointer transition-colors font-medium",
        config.className,
        className
      )}
      onClick={onClick}
    >
      {config.label}
    </Badge>
  );
}
