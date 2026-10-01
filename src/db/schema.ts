import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

// ---------- Catalogue ----------

export const categories = sqliteTable("categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
});

export const products = sqliteTable(
  "products",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    fabric: text("fabric").notNull().default(""),
    care: text("care").notNull().default(""),
    fitNote: text("fit_note").notNull().default(""), // e.g. "Model is 5'8" wearing M"
    price: integer("price").notNull(), // LKR, whole rupees
    compareAtPrice: integer("compare_at_price"), // original price when on sale
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

export const productImages = sqliteTable("product_images", {
  id: id(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

export const variants = sqliteTable(
  "variants",
  {
    id: id(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    color: text("color").notNull(),
    colorHex: text("color_hex").notNull().default("#cccccc"),
    sku: text("sku").notNull().default(""),
    stock: integer("stock").notNull().default(0),
  },
  (t) => [
    uniqueIndex("variant_unique").on(t.productId, t.size, t.color),
  ],
);

// ---------- Orders ----------

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentMethod = "COD" | "CARD";

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    orderNumber: text("order_number").notNull().unique(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    note: text("note"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    subtotal: integer("subtotal").notNull(),
    couponCode: text("coupon_code"),
    discount: integer("discount").notNull().default(0),
    deliveryFee: integer("delivery_fee").notNull(),
    total: integer("total").notNull(),
    paymentMethod: text("payment_method").$type<PaymentMethod>().notNull(),
    paymentStatus: text("payment_status")
      .$type<PaymentStatus>()
      .notNull()
      .default("UNPAID"),
    paymentRef: text("payment_ref"),
    status: text("status").$type<OrderStatus>().notNull().default("PENDING"),
    stockRestored: integer("stock_restored", { mode: "boolean" })
      .notNull()
      .default(false),
    trackingNumber: text("tracking_number"),
    adminNote: text("admin_note"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_phone_idx").on(t.phone),
    index("orders_user_idx").on(t.userId),
  ],
);

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  variantId: text("variant_id").references(() => variants.id, {
    onDelete: "set null",
  }),
  // Snapshot so the order still reads correctly if the product changes later
  productName: text("product_name").notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  image: text("image"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

export const orderEvents = sqliteTable("order_events", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

// ---------- Admin ----------

export const adminUsers = sqliteTable("admin_users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

// ---------- Customer accounts (Better Auth) ----------
// Table and column names follow Better Auth's defaults.

const ts = (name: string) => integer(name, { mode: "timestamp_ms" });

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: ts("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: ts("created_at").notNull(),
  updatedAt: ts("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: ts("access_token_expires_at"),
  refreshTokenExpiresAt: ts("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: ts("created_at").notNull(),
  updatedAt: ts("updated_at").notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").$defaultFn(() => new Date()),
  updatedAt: ts("updated_at").$defaultFn(() => new Date()),
});

export const addresses = sqliteTable("addresses", {
  id: id(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const wishlistItems = sqliteTable(
  "wishlist_items",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("wishlist_unique").on(t.userId, t.productId)],
);

// ---------- Reviews ----------

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const reviews = sqliteTable(
  "reviews",
  {
    id: id(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull(),
    images: text("images", { mode: "json" }).$type<string[]>().notNull().default([]),
    sizeBought: text("size_bought"),
    verifiedPurchase: integer("verified_purchase", { mode: "boolean" }).notNull().default(false),
    status: text("status").$type<ReviewStatus>().notNull().default("PENDING"),
    createdAt: createdAt(),
  },
  (t) => [
    index("reviews_product_idx").on(t.productId, t.status),
    uniqueIndex("reviews_one_per_user").on(t.productId, t.userId),
  ],
);

// ---------- Back-in-stock alerts ----------

export const stockAlerts = sqliteTable(
  "stock_alerts",
  {
    id: id(),
    variantId: text("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    createdAt: createdAt(),
    notifiedAt: integer("notified_at", { mode: "timestamp" }),
  },
  (t) => [uniqueIndex("stock_alert_unique").on(t.variantId, t.email)],
);

// ---------- Coupons ----------

export const COUPON_TYPES = ["PERCENT", "FIXED", "FREE_DELIVERY"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const coupons = sqliteTable("coupons", {
  id: id(),
  code: text("code").notNull().unique(), // stored UPPERCASE
  type: text("type").$type<CouponType>().notNull(),
  value: integer("value").notNull().default(0), // % for PERCENT, rupees for FIXED
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxUses: integer("max_uses"), // null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  onePerCustomer: integer("one_per_customer", { mode: "boolean" }).notNull().default(false),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

// ---------- Relations ----------

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(variants),
  reviews: many(reviews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  alerts: many(stockAlerts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  events: many(orderEvents),
  user: one(user, { fields: [orders.userId], references: [user.id] }),
}));

export const userRelations = relations(user, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
  wishlist: many(wishlistItems),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, { fields: [addresses.userId], references: [user.id] }),
}));

export const wishlistRelations = relations(wishlistItems, ({ one }) => ({
  user: one(user, { fields: [wishlistItems.userId], references: [user.id] }),
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(user, { fields: [reviews.userId], references: [user.id] }),
}));

export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  variant: one(variants, { fields: [stockAlerts.variantId], references: [variants.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
