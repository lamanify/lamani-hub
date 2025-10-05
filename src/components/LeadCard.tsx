import { Eye, Pencil, Trash, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type LeadStatus } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatPhone } from "@/lib/formatPhone";
import { formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  created_at: string;
  custom: Record<string, any> | null;
}

interface LeadCardProps {
  lead: Lead;
  onView: (id: string) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadCard({ lead, onView, onDelete }: LeadCardProps) {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
      onClick={() => onView(lead.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 truncate">{lead.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{formatPhone(lead.phone)}</span>
              <div onClick={handleWhatsAppClick}>
                <WhatsAppButton 
                  phone={lead.phone} 
                  variant="icon" 
                  className="h-8 w-8 flex-shrink-0"
                />
              </div>
            </div>
            {lead.email && (
              <p className="text-sm text-muted-foreground mt-1 truncate">{lead.email}</p>
            )}
          </div>
          
          <div className="flex items-start gap-2 flex-shrink-0">
            <div onClick={(e) => e.stopPropagation()}>
              <StatusBadge status={lead.status} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(lead.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(lead)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span className="capitalize">{lead.source || "Manual"}</span>
          <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
