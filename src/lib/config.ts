// Edit these to match your business. Everything customer-facing reads from here.

export const store = {
  name: "KESH",
  tagline: "Everyday clothing, made to be worn often.",
  email: "hello@kesh.lk",
  phone: "+94 77 123 4567",
  // International format without "+" or spaces, used for the WhatsApp button
  whatsapp: "94771234567",
  address: "No. 12, Galle Road, Colombo 03",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  currency: "LKR",
  lowStockThreshold: 3,
};

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

// Delivery fees by district (LKR). Adjust to your courier's rates.
export const DISTRICTS: Record<string, number> = {
  Colombo: 350,
  Gampaha: 400,
  Kalutara: 400,
  Kandy: 450,
  Matale: 450,
  "Nuwara Eliya": 500,
  Galle: 450,
  Matara: 450,
  Hambantota: 500,
  Jaffna: 550,
  Kilinochchi: 550,
  Mannar: 550,
  Vavuniya: 550,
  Mullaitivu: 550,
  Batticaloa: 550,
  Ampara: 550,
  Trincomalee: 550,
  Kurunegala: 450,
  Puttalam: 450,
  Anuradhapura: 500,
  Polonnaruwa: 500,
  Badulla: 500,
  Monaragala: 500,
  Ratnapura: 450,
  Kegalle: 450,
};

// Orders at or above this subtotal get free delivery. Set to 0 to disable.
export const FREE_DELIVERY_OVER = 10000;

export function deliveryFeeFor(district: string, subtotal: number) {
  if (FREE_DELIVERY_OVER > 0 && subtotal >= FREE_DELIVERY_OVER) return 0;
  return DISTRICTS[district] ?? 500;
}

// Body measurements in inches. Shown on product pages and /size-guide.
export const SIZE_CHART = {
  headers: ["Size", "Chest", "Waist", "Hip"],
  rows: [
    ["XS", "32–33", "25–26", "34–35"],
    ["S", "34–35", "27–28", "36–37"],
    ["M", "36–38", "29–31", "38–40"],
    ["L", "39–41", "32–34", "41–43"],
    ["XL", "42–44", "35–37", "44–46"],
    ["XXL", "45–47", "38–40", "47–49"],
  ],
};
