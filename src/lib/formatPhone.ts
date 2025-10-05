export function formatPhone(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format Malaysian numbers (+60 12 345 6789)
  if (cleaned.startsWith("60") && cleaned.length >= 10) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 7);
    const secondPart = cleaned.slice(7, 11);
    return `+${countryCode} ${areaCode} ${firstPart} ${secondPart}`.trim();
  }
  
  // Default format for other numbers
  return phone;
}
