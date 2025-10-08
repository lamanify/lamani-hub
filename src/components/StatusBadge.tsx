import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadStatus =
  | "new_inquiry"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

interface StatusBadgeProps {
  status: LeadStatus;
  size?: "sm" | "default" | "lg";
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
  }
> = {
  new_inquiry: {
    label: "New Inquiry",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  contacted: {
    label: "Contacted",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  qualified: {
    label: "Qualified",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  converted: {
    label: "Converted",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
  },
  lost: {
    label: "Lost",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
  },
};

export function StatusBadge({ status, size = "default", onClick, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new_inquiry;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-0 transition-colors",
        config.bgColor,
        config.textColor,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-base px-3 py-1",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      onClick={onClick}
    >
      {config.label}
    </Badge>
  );
}

export function getStatusLabel(status: LeadStatus): string {
  return STATUS_CONFIG[status]?.label || "Unknown";
}

export function getAllStatuses(): LeadStatus[] {
  return Object.keys(STATUS_CONFIG) as LeadStatus[];
}
