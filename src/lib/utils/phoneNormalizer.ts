/**
 * Phone number normalization utilities for Malaysian numbers
 * All phone numbers are stored in E.164 format: +60XXXXXXXXX
 */

/**
 * Normalizes Malaysian phone numbers to E.164 format (+60XXXXXXXXX)
 * 
 * Examples:
 * - "012-345 6789" → "+60123456789"
 * - "0123456789" → "+60123456789"
 * - "60123456789" → "+60123456789"
 * - "+60123456789" → "+60123456789" (already normalized)
 * - "123456789" → "+60123456789" (assumes missing +60)
 * 
 * @param phone - Raw phone input
 * @returns Normalized phone in +60XXXXXXXXX format
 * @throws Error if phone number is invalid
 */
export function normalizePhone(phone: string): string {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // Remove all non-digit characters (spaces, dashes, parentheses, plus signs)
  const cleaned = phone.replace(/\D/g, "");

  // Handle empty or too short
  if (!cleaned || cleaned.length < 9) {
    throw new Error("Invalid phone number: too short");
  }

  // Handle too long
  if (cleaned.length > 12) {
    throw new Error("Invalid phone number: too long");
  }

  // Logic:
  // 1. If starts with '60' (country code without +)
  if (cleaned.startsWith("60")) {
    // Already has country code, just add +
    return "+" + cleaned;
  }

  // 2. If starts with '0' (local Malaysian format)
  if (cleaned.startsWith("0")) {
    // Remove leading 0 and add +60
    return "+60" + cleaned.substring(1);
  }

  // 3. Otherwise (no country code, no leading 0)
  // Assume it's missing both and add +60
  return "+60" + cleaned;
}

/**
 * Formats normalized phone for display
 * 
 * Example: "+60123456789" → "+60 12 345 6789"
 * 
 * @param phone - Normalized phone (+60XXXXXXXXX)
 * @returns Formatted phone for UI display
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";

  // If not normalized format, try to normalize first
  if (!phone.startsWith("+60")) {
    try {
      phone = normalizePhone(phone);
    } catch {
      return phone; // Return as-is if normalization fails
    }
  }

  // Pattern: +60 12 345 6789
  const countryCode = phone.slice(0, 3); // +60
  const part1 = phone.slice(3, 5); // 12
  const part2 = phone.slice(5, 8); // 345
  const part3 = phone.slice(8); // 6789

  return `${countryCode} ${part1} ${part2} ${part3}`.trim();
}

/**
 * Validates if a phone number is valid Malaysian format
 * 
 * Valid patterns:
 * - Mobile: 01X XXXX XXXX (10-11 digits after 0)
 * - Landline: 0X XXX XXXX (9-10 digits after 0)
 * 
 * @param phone - Phone to validate
 * @returns true if valid
 */
export function isValidMalaysianPhone(phone: string): boolean {
  if (!phone) return false;

  const cleaned = phone.replace(/\D/g, "");

  // Check if starts with 60 (country code)
  if (cleaned.startsWith("60")) {
    // Should be 11-12 digits total (60 + 9-10 digits)
    return cleaned.length >= 11 && cleaned.length <= 12;
  }

  // Check if starts with 0 (local format)
  if (cleaned.startsWith("0")) {
    // Should be 10-11 digits total (0 + 9-10 digits)
    return cleaned.length >= 10 && cleaned.length <= 11;
  }

  // If no prefix, should be 9-10 digits
  return cleaned.length >= 9 && cleaned.length <= 10;
}

/**
 * Formats phone number for WhatsApp URL (removes + and spaces)
 * 
 * Example: "+60123456789" → "60123456789"
 * 
 * @param phone - Normalized phone number
 * @returns Clean phone number for WhatsApp link
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";

  // If not normalized, normalize first
  if (!phone.startsWith("+60")) {
    try {
      phone = normalizePhone(phone);
    } catch {
      return phone.replace(/\D/g, "");
    }
  }

  // Remove the + sign
  return phone.replace(/\D/g, "");
}

/**
 * Safe phone normalization that returns the original value on error
 * Useful for form inputs where you don't want to throw errors
 * 
 * @param phone - Raw phone input
 * @returns Normalized phone or original value if normalization fails
 */
export function safeNormalizePhone(phone: string): string {
  try {
    return normalizePhone(phone);
  } catch {
    return phone;
  }
}
