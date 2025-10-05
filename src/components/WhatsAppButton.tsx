import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPhoneForWhatsApp } from "@/lib/utils/phoneNormalizer";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phone: string; // Normalized format: +60XXXXXXXXX
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "icon"; // 'icon' = icon only, 'default' = icon + text
  message?: string; // Optional pre-filled message
  className?: string;
  onClick?: () => void; // Optional analytics callback
}

export function WhatsAppButton({
  phone,
  size = "icon",
  variant = "icon",
  message,
  className,
  onClick,
}: WhatsAppButtonProps) {
  // Validate phone number
  if (!phone || (!phone.startsWith("+60") && !phone.startsWith("60"))) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant="ghost"
            disabled
            className={cn("cursor-not-allowed", className)}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Invalid phone number</TooltipContent>
      </Tooltip>
    );
  }

  // Clean phone for WhatsApp URL (remove + and spaces)
  const cleanPhone = formatPhoneForWhatsApp(phone);

  // Build WhatsApp URL
  let whatsappUrl = `https://wa.me/${cleanPhone}`;

  // Add pre-filled message if provided
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    whatsappUrl += `?text=${encodedMessage}`;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click in tables
    onClick?.(); // Call optional analytics callback
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size={size}
          variant={variant === "icon" ? "ghost" : "default"}
          className={cn(
            variant === "icon"
              ? "h-9 w-9 p-0 touch-manipulation"
              : "bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2 min-h-[44px] touch-manipulation",
            className
          )}
          asChild
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
          >
            <MessageCircle
              className={cn(
                variant === "icon" ? "h-4 w-4" : "h-4 w-4",
                variant === "icon" ? "text-green-600" : ""
              )}
            />
            {variant === "default" && <span>Chat on WhatsApp</span>}
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Open WhatsApp to message {phone}</p>
      </TooltipContent>
    </Tooltip>
  );
}
