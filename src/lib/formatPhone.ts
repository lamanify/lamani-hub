import { formatPhoneDisplay } from "@/lib/utils/phoneNormalizer";

export function formatPhone(phone: string): string {
  return formatPhoneDisplay(phone);
}
