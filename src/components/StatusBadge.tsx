import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeadStatus =
  | "new_inquiry"
  | "contact_attempted"
  | "contacted"
  | "appointment_scheduled"
  | "consultation_complete"
  | "treatment_in_progress"
  | "inactive"
  | "disqualified";

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
  contact_attempted: {
    label: "Contact Attempted",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  contacted: {
    label: "Contacted",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  appointment_scheduled: {
    label: "Appointment Scheduled",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  consultation_complete: {
    label: "Consultation Complete",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-700",
  },
  treatment_in_progress: {
    label: "Treatment In Progress",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
  },
  inactive: {
    label: "Inactive",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
  disqualified: {
    label: "Disqualified",
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
