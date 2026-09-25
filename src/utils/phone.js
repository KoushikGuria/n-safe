/**
 * Normalizes a phone number for consistent internal storage.
 * Keeps a leading '+' if present and removes all whitespace, dashes, dots, and parentheses.
 * If no leading '+' is provided but user typed digits, preserves or prepends '+' if applicable.
 * 
 * Example:
 * "+91 98765 43210" -> "+919876543210"
 * "98765-43210"     -> "+9876543210" or "9876543210" (stored with standard format)
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const trimmed = rawPhone.trim();
  const hasPlus = trimmed.startsWith('+');
  
  // Extract all digit characters
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return '';

  return hasPlus ? `+${digitsOnly}` : `+${digitsOnly}`;
}

/**
 * Validates whether a phone number has reasonable E.164 length.
 * International phone numbers range from 7 to 15 digits.
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  // ITU-T E.164 standard: max 15 digits, min ~7 digits
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Converts a stored phone number to the format required by WhatsApp API (wa.me).
 * wa.me requires international format WITHOUT '+' and WITHOUT any non-digit characters.
 * 
 * Example:
 * "+919876543210" -> "919876543210"
 */
export function toWhatsAppNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Builds the full wa.me link with an optional prefilled text message.
 */
export function getWhatsAppUrl(phone, message = 'Hello, I scanned your QR code and would like to contact you.') {
  const cleanNumber = toWhatsAppNumber(phone);
  if (!cleanNumber) return '#';
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Builds the tel: URI for direct phone calls.
 * Example: "+919876543210" -> "tel:+919876543210"
 */
export function toTelUri(phone) {
  if (!phone) return '#';
  const digits = String(phone).replace(/\D/g, '');
  return `tel:+${digits}`;
}

/**
 * Formats a phone number for attractive visual display.
 * Example: "+919876543210" -> "+91 98765 43210"
 */
export function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return phone;

  // If length is standard 12 (e.g. 91 98765 43210)
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  // If length is 11 (e.g. 1 123 456 7890)
  if (digits.length === 11) {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // If length is 10 (e.g. 98765 43210)
  if (digits.length === 10) {
    return `+${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return `+${digits}`;
}
