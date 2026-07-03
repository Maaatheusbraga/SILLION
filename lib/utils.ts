export function whatsAppUrl(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const base = `https://wa.me/${withCountry}`;
  if (text) return `${base}?text=${encodeURIComponent(text)}`;
  return base;
}
