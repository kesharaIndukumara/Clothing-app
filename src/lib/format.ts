export function formatPrice(amount: number) {
  return "Rs " + amount.toLocaleString("en-LK", { maximumFractionDigits: 0 });
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(d: Date) {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}

// Normalise Sri Lankan phone numbers to 07XXXXXXXX so tracking lookups match
export function normalizePhone(raw: string) {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+94")) p = "0" + p.slice(3);
  else if (p.startsWith("94") && p.length === 11) p = "0" + p.slice(2);
  return p;
}
