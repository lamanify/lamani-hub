import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPhoneForWhatsApp } from "@/lib/utils/phoneNormalizer";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phone: string; // Normalized format: +60XXXXXXXXX
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "icon"; // 'icon' = icon only, 'default' = icon + text
  message?: string; // Optional pre-filled message
  className?: string;
  onClick?: () => void; // Optional analytics callback
  icon?: React.ReactNode; // Optional custom icon
}

export function WhatsAppButton({
  phone,
  size = "icon",
  variant = "icon",
  message,
  className,
  onClick,
  icon,
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
            {icon || (
              <div className="h-4 w-4 text-muted-foreground opacity-50">
                <svg viewBox="0 0 48 48" fill="currentColor">
                  <path d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z" />
                </svg>
              </div>
            )}
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
              ? "h-14 w-14 p-0 touch-manipulation hover:bg-transparent"
              : "bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2 min-h-[44px] touch-manipulation",
            className,
          )}
          asChild
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
            {icon || (
              <div
                className={cn(
                  "flex items-center justify-center", // <-- ADD THIS LINE
                  variant === "icon" ? "h-16 w-16" : "h-4 w-4",
                )}
              >
                <svg
                  viewBox="0 0 48 48"
                  fill="currentColor"
                  className="h-full w-full" // <-- ADD THIS LINE
                >
                  <path fill="#40c351" d="..." />
                  <path fill="#fff" fillRule="evenodd" d="..." clipRule="evenodd" />
                </svg>
              </div>
            )}
            {variant === "default" && <span>WhatsApp</span>}
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Open WhatsApp to message {phone}</p>
      </TooltipContent>
    </Tooltip>
  );
}
