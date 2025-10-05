import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizePhone, isValidMalaysianPhone } from "@/lib/utils/phoneNormalizer";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
  onValidationError?: (error: string | null) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, onChange, onValidationError, className, ...props }, ref) => {
    const [localError, setLocalError] = useState<string | null>(null);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!value) {
        setLocalError(null);
        onValidationError?.(null);
        return;
      }

      try {
        // Validate first
        if (!isValidMalaysianPhone(value)) {
          throw new Error("Invalid Malaysian phone number");
        }

        // Normalize
        const normalized = normalizePhone(value);
        
        // Update the input with normalized value
        e.target.value = normalized;
        onChange?.(normalized);
        
        setLocalError(null);
        onValidationError?.(null);
      } catch (err) {
        const errorMsg = "Please enter a valid Malaysian phone (e.g., 012-345 6789)";
        setLocalError(errorMsg);
        onValidationError?.(errorMsg);
      }

      // Call original onBlur if provided
      props.onBlur?.(e);
    };

    const displayError = error || localError;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(displayError && "text-destructive")}>
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          type="tel"
          placeholder="+60 12 345 6789"
          {...props}
          onBlur={handleBlur}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            displayError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${props.id}-error` : undefined}
        />
        {displayError && (
          <p id={`${props.id}-error`} className="text-sm text-destructive">
            {displayError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter Malaysian phone number (e.g., 012-345 6789)
        </p>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
