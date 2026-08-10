/**
 * Helper to build direct 1-click WhatsApp deep links
 */

export function cleanIndianPhone(phoneStr) {
  if (!phoneStr) return null;

  // Extract digits only
  const digits = String(phoneStr).replace(/\D/g, '');

  // Check if mobile (10 digits starting 6,7,8,9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // If 12 digits starting 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // If 11 digits starting 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }

  return null;
}

export function buildWhatsAppLink(phoneStr, message = '') {
  const cleanPhone = cleanIndianPhone(phoneStr);
  if (!cleanPhone) return null;

  const encodedMsg = encodeURIComponent(message || 'Hello! Reaching out regarding business workflows.');
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}
