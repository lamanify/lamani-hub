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
                  <path d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"/>
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
            {icon || (
              <div className={cn("h-4 w-4", variant === "icon" ? "" : "")}>
                <svg viewBox="0 0 48 48" fill="currentColor">
                  <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"/>
                  <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"/>
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
