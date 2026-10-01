# KESH: Clothing Store

A full e-commerce site for a small clothing business, with an admin panel for products and orders.
Built with **Next.js 16** (frontend and backend in one app), **Drizzle ORM** and **SQLite/libSQL**.

---

## Quick start (Windows, macOS or Linux)

You need **Node.js 20.9 or newer** (`node -v` to check).

```bash
npm install
npm run setup     # creates the database, the admin account and 10 demo products
npm run dev
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin
  - Email: `admin@example.com`
  - Password: `ChangeMe123!`

**Change the admin password before going live.** Edit `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, delete `data/store.db`, then run `npm run setup` again. Or create a new admin with the steps in "Managing admins" below.

### Your business details

Edit **`src/lib/config.ts`** to set your store name, phone, WhatsApp number, address, delivery fee per district, the free-delivery limit and the size chart. Policy text lives in `src/app/(store)/policies/[slug]/page.tsx`.

To remove the demo products: in the admin panel open each product and click **Delete**, or delete `data/store.db` and set up again with your own products.

---

## What's included (Phase 1)

### Storefront
| Page | URL |
|---|---|
| Home: hero, categories, featured, new arrivals | `/` |
| Shop with category / size / colour / sale filters, search, sorting | `/shop` |
| Product: gallery, colour + size picker, live stock, size chart, WhatsApp enquiry | `/products/[slug]` |
| Slide-out cart and full cart page (saved in the browser) | `/cart` |
| Guest checkout with district delivery fee, **Cash on Delivery** or **PayHere card** | `/checkout` |
| Order confirmation | `/order/[orderNumber]` |
| Order tracking (order number + phone) | `/track` |
| About, Contact, Size guide, Delivery, Returns, Privacy, Terms | `/about`, `/contact`, `/size-guide`, `/policies/*` |

### Admin panel (`/admin`)
- **Dashboard:** orders and revenue today and for the last 30 days, orders waiting to be fulfilled, COD cash to collect, low-stock list, recent orders
- **Orders:** filter by status, search by order no., phone or name, pagination
  - Change status: Pending → Confirmed → Packed → Shipped → Delivered / Cancelled / Returned
  - Cancelling or returning **puts the stock back automatically**. Re-opening takes it again.
  - Marking a COD order *Delivered* marks it paid
  - Payment status, courier tracking number, internal notes, full history log
  - One-click call / WhatsApp the customer, print a packing slip
- **Products:** add, edit, delete, or hide from the shop
  - Multiple images with upload, reorder and remove
  - Size × colour variants with SKU and stock per variant, plus "quick add a colour" for all sizes at once
  - Sale price ("Was" price), featured on home page, category, fabric, care, fit note
- **Categories:** add, rename, reorder, delete

### Built-in safety
- Prices and stock are **always re-checked on the server** at checkout. Prices sent by the browser are ignored.
- Stock is decremented inside a database transaction with a "stock >= qty" check, so two people can't buy the last item.
- PayHere notifications are verified with the MD5 signature **and** the amount must match the order.
- Order tracking needs the order number **and** phone number.
- Admin: bcrypt-hashed passwords, signed httpOnly cookie, login rate limit, and a `requireAdmin()` check on every admin page and action.
- Uploads only accept JPG, PNG, WebP or AVIF under 5 MB, saved with random file names.

---

## How the backend works (no separate server)

```
Browser ──► Next.js app (one process)
              ├─ Server Components  → read the DB directly (pages)
              ├─ Server Actions     → place order, save product, update order status
              ├─ Route Handlers     → /api/payhere/notify (PayHere webhook), /uploads/* (images)
              └─ proxy.ts           → keeps logged-out visitors out of /admin
                       │
                       ▼
              SQLite file (data/store.db) or Turso
```

| Folder | What's inside |
|---|---|
| `src/app/(store)/` | Customer-facing pages |
| `src/app/admin/` | Admin login and panel |
| `src/app/api/payhere/notify/` | Payment webhook |
| `src/db/schema.ts` | Database tables |
| `src/lib/` | Auth, PayHere, stock, uploads, config |
| `scripts/seed.ts` | Creates admin and demo data |
| `drizzle/` | SQL migrations |

## How auth works

1. Admins are stored in the `admin_users` table with **bcrypt** password hashes.
2. Logging in (`src/app/admin/login/actions.ts`) sets a **JWT signed with `AUTH_SECRET`** in an **httpOnly, SameSite=Lax** cookie (Secure in production). The session lasts 7 days.
3. `src/proxy.ts` redirects anyone without a valid cookie from `/admin/*` to the login page.
4. Every admin page and Server Action calls `requireAdmin()` (`src/lib/auth.ts`), because Server Actions are public endpoints.
5. Five failed logins in 15 minutes locks that email and IP out temporarily.

**Managing admins:** to add another admin, set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` to the new details and run `npm run db:seed`. It only creates admins that don't exist yet.

---

## Card payments (PayHere)

1. Create a sandbox account at https://sandbox.payhere.lk and add your domain to get a Merchant ID and Merchant Secret.
2. Put them in `.env`:
   ```
   PAYHERE_MERCHANT_ID="121xxxx"
   PAYHERE_MERCHANT_SECRET="..."
   PAYHERE_SANDBOX="true"
   NEXT_PUBLIC_SITE_URL="https://your-domain.lk"
   ```
3. Restart. The card option appears at checkout. Until then, only COD shows.
4. PayHere confirms payments by calling `NEXT_PUBLIC_SITE_URL/api/payhere/notify`. **This must be a public URL.** Localhost won't receive it, so while testing locally use a tunnel such as `ngrok http 3000` and set `NEXT_PUBLIC_SITE_URL` to the ngrok URL.
5. When approved for live payments, set `PAYHERE_SANDBOX="false"` and use your live credentials.

Check the hash formulas in `src/lib/payhere.ts` against PayHere's current documentation before going live.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build and server |
| `npm run setup` | Apply migrations + seed |
| `npm run db:generate` | After editing `src/db/schema.ts`, create a new migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse and edit the database in your browser |
| `npm run lint` | Lint |

---

## Deploying (low cost)

**Option A: small VPS (recommended).** A Hetzner, DigitalOcean or Contabo server with 1–2 GB RAM.
```bash
git clone <your repo> && cd clothing-app
npm ci && cp .env.example .env   # fill in real values, a new AUTH_SECRET and NODE_ENV=production
npm run setup && npm run build
npx pm2 start "npm start" --name store   # keeps it running
```
Put **Caddy** or **Nginx** in front for HTTPS (Caddy does free certificates automatically). Back up `data/store.db` and the `uploads/` folder every day, for example with a cron job copying them to cloud storage.

**Option B: Turso database.** Create a free database at https://turso.tech, set `DATABASE_URL="libsql://..."` and `DATABASE_AUTH_TOKEN`, then run `npm run setup`. Product images still need disk storage or Cloudinary (Phase 3).

---

## Roadmap

### Phase 2: after launch
- Customer accounts (Better Auth): order history, saved addresses, Google login
- Wishlist
- Discount coupons
- Product reviews with photos
- "Notify me when back in stock"
- Order emails with Resend (confirmation, shipped)
- Invoice PDF
- Google Analytics + Meta Pixel
- Sitemap.xml and structured data for Google Shopping

### Phase 3: growth
- SMS notifications (Notify.lk / Text.lk)
- Cloudinary or Cloudflare R2 for images, then switch `<img>` to `next/image`
- Courier API integration for automatic tracking numbers
- Staff accounts with roles (owner / staff)
- Sales reports and best sellers
- Loyalty points, referrals, bundle deals
- Instagram/Facebook catalogue sync
- Move to PostgreSQL if you outgrow SQLite (Drizzle supports both)
