// Creates the first admin account and some demo products.
// Run with: npm run db:seed   (safe to run more than once)
import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as t from "../src/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/store.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema: t });

// ---------- Placeholder product images (SVG) ----------
const SHAPES: Record<string, string> = {
  tee: `<path d="M250 250 L335 205 Q400 255 465 205 L550 250 L645 345 L578 405 L540 372 L540 770 L260 770 L260 372 L222 405 L155 345 Z"/>`,
  shirt: `<path d="M262 228 L342 198 L400 262 L458 198 L538 228 L604 300 L655 650 L592 664 L545 392 L545 800 L255 800 L255 392 L208 664 L145 650 L196 300 Z"/><path d="M400 262 L400 800" stroke="rgba(0,0,0,.18)" stroke-width="4" fill="none"/><g fill="rgba(0,0,0,.22)"><circle cx="400" cy="340" r="7"/><circle cx="400" cy="440" r="7"/><circle cx="400" cy="540" r="7"/><circle cx="400" cy="640" r="7"/></g>`,
  dress: `<path d="M332 190 L362 182 Q400 236 438 182 L468 190 L482 262 L458 410 L612 820 L188 820 L342 410 L318 262 Z"/><path d="M342 410 Q400 430 458 410" stroke="rgba(0,0,0,.18)" stroke-width="5" fill="none"/>`,
  trousers: `<path d="M282 190 L518 190 L560 815 L432 815 L400 372 L368 815 L240 815 Z"/><path d="M282 240 L518 240" stroke="rgba(0,0,0,.18)" stroke-width="5"/>`,
  hoodie: `<path d="M330 215 Q400 120 470 215 L548 245 L612 315 L660 660 L596 676 L548 405 L548 790 L252 790 L252 405 L204 676 L140 660 L188 315 L252 245 Z"/><path d="M330 215 Q400 300 470 215" stroke="rgba(0,0,0,.2)" stroke-width="6" fill="none"/><path d="M300 600 L500 600 L480 700 L320 700 Z" fill="rgba(0,0,0,.12)"/>`,
  skirt: `<path d="M312 290 L488 290 L604 740 L196 740 Z"/><path d="M312 330 L488 330" stroke="rgba(0,0,0,.18)" stroke-width="5"/>`,
};

function svg(shape: string, color: string, bg: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="${bg}"/><ellipse cx="400" cy="880" rx="250" ry="22" fill="rgba(0,0,0,.06)"/><g fill="${color}">${SHAPES[shape]}</g></svg>`;
}

const seedDir = path.join(process.cwd(), "public", "seed");
mkdirSync(seedDir, { recursive: true });
function makeImages(slug: string, shape: string, colors: { hex: string }[]) {
  const backgrounds = ["#efe9e0", "#e7e2d9", "#f1ece6"];
  return colors.map((c, i) => {
    const file = `${slug}-${i}.svg`;
    writeFileSync(path.join(seedDir, file), svg(shape, c.hex, backgrounds[i % 3]));
    return `/seed/${file}`;
  });
}

// ---------- Demo catalogue ----------
type Demo = {
  name: string;
  category: string;
  shape: keyof typeof SHAPES;
  price: number;
  compareAtPrice?: number;
  featured?: boolean;
  description: string;
  fabric: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  stock?: number;
};

const CATEGORIES = ["T-Shirts", "Shirts", "Dresses", "Trousers", "Hoodies", "Skirts"];

const PRODUCTS: Demo[] = [
  { name: "Everyday Cotton Tee", category: "T-Shirts", shape: "tee", price: 2490, featured: true,
    description: "A soft, mid-weight tee with a relaxed fit. Our most worn piece.",
    fabric: "100% combed cotton, 180 GSM", sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#1f1f1f" }, { name: "White", hex: "#fbfaf7" }, { name: "Olive", hex: "#6b6b3a" }] },
  { name: "Boxy Pocket Tee", category: "T-Shirts", shape: "tee", price: 2890, compareAtPrice: 3490,
    description: "Cropped, boxy shape with a chest pocket. Pairs well with high-waisted bottoms.",
    fabric: "100% cotton jersey", sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Sand", hex: "#d6c3a1" }, { name: "Terracotta", hex: "#b4532a" }] },
  { name: "Linen Resort Shirt", category: "Shirts", shape: "shirt", price: 5490, featured: true,
    description: "Breathable linen, made for Colombo heat. Wear it open or buttoned.",
    fabric: "100% linen", sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Ivory", hex: "#efe6d2" }, { name: "Sky", hex: "#9fb9cf" }] },
  { name: "Oxford Button-Down", category: "Shirts", shape: "shirt", price: 4990,
    description: "A classic for office days, with a soft collar that holds its shape.",
    fabric: "100% cotton oxford", sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "White", hex: "#f7f6f2" }, { name: "Blue", hex: "#5d7fa8" }] },
  { name: "Wrap Midi Dress", category: "Dresses", shape: "dress", price: 7490, featured: true,
    description: "Flattering wrap front with an adjustable tie waist. Falls below the knee.",
    fabric: "Viscose crepe", sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Rust", hex: "#a2462a" }, { name: "Forest", hex: "#2f4a3a" }] },
  { name: "Batik Sundress", category: "Dresses", shape: "dress", price: 6890, compareAtPrice: 7990,
    description: "Lightweight sundress in a hand-finished batik print, made locally.",
    fabric: "100% cotton voile", sizes: ["S", "M", "L"],
    colors: [{ name: "Indigo", hex: "#33416e" }], stock: 2 },
  { name: "Tailored Wide Trousers", category: "Trousers", shape: "trousers", price: 5990, featured: true,
    description: "High waist, wide leg and a pressed front crease. Smart enough for work.",
    fabric: "Poly-viscose blend", sizes: ["XS", "S", "M", "L", "XL"],
    colors: [{ name: "Charcoal", hex: "#3a3a3c" }, { name: "Beige", hex: "#cdb79a" }] },
  { name: "Relaxed Chinos", category: "Trousers", shape: "trousers", price: 4790,
    description: "Straight-leg chinos with a little stretch for all-day comfort.",
    fabric: "98% cotton, 2% elastane", sizes: ["M", "L", "XL", "XXL"],
    colors: [{ name: "Khaki", hex: "#b59f74" }, { name: "Navy", hex: "#283449" }] },
  { name: "Heavyweight Hoodie", category: "Hoodies", shape: "hoodie", price: 6490,
    description: "Brushed fleece inside and a double-layered hood. For cool evenings and air-conditioned offices.",
    fabric: "80% cotton, 20% polyester fleece", sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Grey Marl", hex: "#9a9a98" }, { name: "Black", hex: "#222222" }] },
  { name: "A-Line Linen Skirt", category: "Skirts", shape: "skirt", price: 3990,
    description: "Easy A-line skirt with an elastic back waist and side pockets.",
    fabric: "Linen-cotton blend", sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "Natural", hex: "#d9ccb4" }, { name: "Black", hex: "#1f1f1f" }], stock: 0 },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  // Admin
  const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const existing = await db.query.adminUsers.findFirst({ where: eq(t.adminUsers.email, email) });
  if (!existing) {
    await db.insert(t.adminUsers).values({
      name: "Store Admin",
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    console.log(`Created admin: ${email}`);
  } else {
    console.log(`Admin ${email} already exists`);
  }

  // Catalogue (only if empty)
  const any = await db.query.products.findFirst();
  if (any) {
    console.log("Products already exist, skipping demo catalogue");
    return;
  }

  const catIds: Record<string, string> = {};
  for (const [i, name] of CATEGORIES.entries()) {
    const [row] = await db
      .insert(t.categories)
      .values({ name, slug: slugify(name), position: i })
      .returning({ id: t.categories.id });
    catIds[name] = row.id;
  }

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const [row] = await db
      .insert(t.products)
      .values({
        name: p.name,
        slug,
        description: p.description,
        fabric: p.fabric,
        care: "Machine wash cold with similar colours. Do not tumble dry. Iron on low.",
        fitNote: "Model is 5'7\" and wears size S.",
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        categoryId: catIds[p.category],
        featured: p.featured ?? false,
      })
      .returning({ id: t.products.id });

    const images = makeImages(slug, p.shape, p.colors);
    await db.insert(t.productImages).values(
      images.map((url, position) => ({ productId: row.id, url, position })),
    );

    const variantRows = p.colors.flatMap((c) =>
      p.sizes.map((size) => ({
        productId: row.id,
        size,
        color: c.name,
        colorHex: c.hex,
        sku: `${slug.slice(0, 6).toUpperCase()}-${c.name.slice(0, 3).toUpperCase()}-${size}`,
        stock: p.stock ?? 5 + Math.floor(Math.random() * 15),
      })),
    );
    await db.insert(t.variants).values(variantRows);
  }
  console.log(`Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products`);
}

main()
  .then(() => client.close())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
