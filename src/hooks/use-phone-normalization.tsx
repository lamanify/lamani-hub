import { useState, useCallback } from "react";
import { normalizePhone, isValidMalaysianPhone } from "@/lib/utils/phoneNormalizer";
import { useToast } from "@/hooks/use-toast";

interface UsePhoneNormalizationOptions {
  onSuccess?: (normalizedPhone: string) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export function usePhoneNormalization(options: UsePhoneNormalizationOptions = {}) {
  const { onSuccess, onError, showToast = true } = options;
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndNormalize = useCallback(
    (phone: string): string | null => {
      setIsValidating(true);
      setError(null);

      try {
        if (!phone) {
          throw new Error("Phone number is required");
        }

        // Validate format
        if (!isValidMalaysianPhone(phone)) {
          throw new Error("Invalid Malaysian phone number format");
        }

        // Normalize
        const normalized = normalizePhone(phone);

        // Success
        onSuccess?.(normalized);
        setIsValidating(false);
        return normalized;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Invalid phone number. Please enter a valid Malaysian phone (e.g., 012-345 6789)";

        setError(errorMessage);
        onError?.(errorMessage);

        if (showToast) {
          toast({
            title: "Invalid Phone Number",
            description: errorMessage,
            variant: "destructive",
          });
        }

        setIsValidating(false);
        return null;
      }
    },
    [onSuccess, onError, showToast, toast]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    validateAndNormalize,
    error,
    isValidating,
    clearError,
  };
}
