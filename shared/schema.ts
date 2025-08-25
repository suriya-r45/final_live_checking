import { sql } from "drizzle-orm";
import { pgTable, uuid, text, decimal, integer, boolean, jsonb, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Removed enum types to simplify database schema - using text fields with defaults

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"), // Phone number for WhatsApp messaging
  role: text("role").notNull().default("guest"), // 'admin' or 'guest'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // OTP fields for forgot password functionality
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  otpVerified: boolean("otp_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category"),
  material: text("material").default("GOLD_22K"),
  priceInr: decimal("price_inr", { precision: 10, scale: 2 }).notNull(),
  priceBhd: decimal("price_bhd", { precision: 10, scale: 3 }).notNull(),
  grossWeight: decimal("gross_weight", { precision: 8, scale: 2 }).notNull(),
  netWeight: decimal("net_weight", { precision: 8, scale: 2 }).notNull(),
  purity: text("purity"), // e.g., "22K", "925", "PT950"
  gemstones: jsonb("gemstones").$type<string[]>().default(sql`'[]'::jsonb`),
  size: text("size"), // Ring size, chain length, etc.
  gender: text("gender").default("UNISEX"), // MALE, FEMALE, UNISEX
  occasion: text("occasion"), // WEDDING, ENGAGEMENT, DAILY, PARTY, RELIGIOUS
  stock: integer("stock").notNull().default(0),
  images: jsonb("images").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  isNewArrival: boolean("is_new_arrival").notNull().default(false),
  // New fields for enhanced pricing calculation
  metalType: text("metal_type").default("GOLD"), // GOLD, SILVER, DIAMOND, OTHER
  isMetalPriceBased: boolean("is_metal_price_based").notNull().default(false),
  makingChargesPercentage: decimal("making_charges_percentage", { precision: 5, scale: 2 }).default("15.00"),
  customPriceInr: decimal("custom_price_inr", { precision: 10, scale: 2 }),
  customPriceBhd: decimal("custom_price_bhd", { precision: 10, scale: 3 }),
  // New fields for barcode functionality
  productCode: text("product_code").unique(), // Auto-generated code like PJ-NP-2025-001
  stones: text("stones").default("None"), // Stone information (None, Diamond, Ruby, etc.)
  goldRateAtCreation: decimal("gold_rate_at_creation", { precision: 10, scale: 2 }), // Gold rate when product was created
  barcode: text("barcode"), // Generated barcode string
  barcodeImageUrl: text("barcode_image_url"), // Path to barcode image
  createdAt: timestamp("created_at").defaultNow(),
});


// Shopping Cart Table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(), // For guest users
  userId: varchar("user_id"), // For logged-in users
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live Gold and Silver Rates Table
export const metalRates = pgTable("metal_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metal: text("metal").notNull(), // 'GOLD' or 'SILVER'
  purity: text("purity").notNull(), // '24K', '22K', '18K' for gold, 'PURE' for silver
  pricePerGramInr: decimal("price_per_gram_inr", { precision: 10, scale: 2 }).notNull(),
  pricePerGramBhd: decimal("price_per_gram_bhd", { precision: 10, scale: 3 }).notNull(),
  pricePerGramUsd: decimal("price_per_gram_usd", { precision: 10, scale: 2 }).notNull(),
  market: text("market").notNull(), // 'INDIA' or 'BAHRAIN'
  source: text("source").notNull(), // API source used
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders Table (replaces bills for e-commerce)
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  currency: text("currency").default("INR"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  makingCharges: decimal("making_charges", { precision: 12, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 12, scale: 2 }).notNull(),
  vat: decimal("vat", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  shipping: decimal("shipping", { precision: 12, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("CASH"),
  paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING, PAID, FAILED, REFUNDED
  orderStatus: text("order_status").notNull().default("PENDING"), // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep bills table for backward compatibility (admin billing)
export const bills = pgTable("bills", {
  id: uuid("id").defaultRandom().primaryKey(),
  billNumber: text("bill_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  currency: text("currency").default("INR"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  makingCharges: decimal("making_charges", { precision: 12, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 12, scale: 2 }).notNull(),
  vat: decimal("vat", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("CASH"),
  items: jsonb("items").$type<BillItem[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bills: many(bills),
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const productsRelations = relations(products, ({ many }) => ({
  billItems: many(bills),
  orderItems: many(orders),
  cartItems: many(cartItems),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  customer: one(users, {
    fields: [bills.customerEmail],
    references: [users.email],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  customer: one(users, {
    fields: [orders.customerEmail],
    references: [users.email],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// Types
export type BillItem = {
  productId: string;
  productName: string;
  quantity: number;
  priceInr: string;
  priceBhd: string;
  grossWeight: string;
  netWeight: string;
  makingCharges: string;
  discount: string;
  sgst: string;
  cgst: string;
  vat: string; // Bahrain VAT
  total: string;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  priceInr: string;
  priceBhd: string;
  grossWeight: string;
  netWeight: string;
  makingCharges: string;
  discount: string;
  sgst: string;
  cgst: string;
  vat: string;
  total: string;
};

export type MetalRate = {
  id: string;
  metal: 'GOLD' | 'SILVER';
  purity: string;
  pricePerGramInr: string;
  pricePerGramBhd: string;
  pricePerGramUsd: string;
  market: 'INDIA' | 'BAHRAIN';
  source: string;
  lastUpdated: Date;
  createdAt: Date;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

// Categories Management Table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly version
  description: text("description"),
  parentId: varchar("parent_id"), // For subcategories
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent_child"
  }),
  children: many(categories, {
    relationName: "parent_child"
  }),
  products: many(products),
}));

// Update products relation to include categories
export const productsRelationsUpdated = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.category],
    references: [categories.slug],
  }),
  billItems: many(bills),
  orderItems: many(orders),
  cartItems: many(cartItems),
}));

// Jewelry Categories (Legacy - will be replaced by database categories)
export const JEWELRY_CATEGORIES = {
  "RINGS": {
    name: "Rings 💍",
    subCategories: [
      "ENGAGEMENT_RINGS",
      "WEDDING_BANDS", 
      "COUPLE_RINGS",
      "COCKTAIL_PARTY_RINGS",
      "DAILY_WEAR_RINGS",
      "MENS_RINGS"
    ]
  },
  "NECKLACES": {
    name: "Necklaces 📿",
    subCategories: [
      "CHAINS",
      "CHOKERS",
      "LOCKETS",
      "BEADED_NECKLACES",
      "COLLARS",
      "LONG_NECKLACES_OPERA_CHAINS",
      "MULTI_LAYERED_NECKLACES"
    ]
  },
  "EARRINGS": {
    name: "Earrings 🌸",
    subCategories: [
      "STUDS",
      "HOOPS",
      "DROPS_DANGLERS",
      "CHANDBALIS",
      "JHUMKAS",
      "EAR_CUFFS",
      "KIDS_EARRINGS"
    ]
  },
  "BRACELETS": {
    name: "Bracelets 🔗",
    subCategories: [
      "CUFF",
      "TENNIS",
      "CHARM",
      "CHAIN",
      "BEADED",
      "LINK",
      "BOLO",
      "LEATHER",
      "DIAMOND",
      "GEMSTONE",
      "PEARL",
      "BRIDAL",
      "MINIMALIST",
      "TRADITIONAL"
    ]
  },
  "BANGLES": {
    name: "Bangles 💫",
    subCategories: [
      "CLASSIC",
      "KADA",
      "CUFF",
      "OPENABLE",
      "ADJUSTABLE",
      "CHARM",
      "DIAMOND",
      "GEMSTONE",
      "PEARL",
      "BRIDAL",
      "MINIMALIST",
      "TRADITIONAL",
      "TEMPLE",
      "KUNDAN",
      "POLKI",
      "NAVRATNA"
    ]
  },
  "PENDANTS": {
    name: "Pendants ✨",
    subCategories: [
      "SOLITAIRE",
      "HALO",
      "CLUSTER",
      "HEART",
      "CROSS",
      "INITIAL",
      "DIAMOND",
      "GEMSTONE",
      "PEARL",
      "BRIDAL",
      "MINIMALIST",
      "TRADITIONAL"
    ]
  },
  "MANGALSUTRA": {
    name: "Mangalsutra & Thali Chains 🖤",
    subCategories: [
      "TRADITIONAL_MANGALSUTRA",
      "MODERN_MANGALSUTRA",
      "THALI_THIRUMANGALYAM_CHAINS"
    ]
  },
  "NOSE_JEWELLERY": {
    name: "Nose Jewellery 👃",
    subCategories: [
      "NOSE_PINS",
      "NOSE_RINGS_NATH",
      "SEPTUM_RINGS"
    ]
  },
  "ANKLETS_TOE_RINGS": {
    name: "Anklets & Toe Rings 👣",
    subCategories: [
      "SILVER_ANKLETS",
      "BEADED_ANKLETS",
      "BRIDAL_TOE_RINGS",
      "DAILY_WEAR_TOE_RINGS"
    ]
  },
  "BROOCHES_PINS": {
    name: "Brooches & Pins 🎀",
    subCategories: [
      "SAREE_PINS",
      "SUIT_BROOCHES",
      "BRIDAL_BROOCHES",
      "CUFFLINKS",
      "TIE_PINS"
    ]
  },
  "KIDS_JEWELLERY": {
    name: "Kids Jewellery 🧒",
    subCategories: [
      "BABY_BANGLES",
      "NAZARIYA_BRACELETS",
      "KIDS_EARRINGS",
      "KIDS_CHAINS",
      "KIDS_RINGS"
    ]
  },
  "BRIDAL_COLLECTIONS": {
    name: "Bridal & Special Collections 👰",
    subCategories: [
      "BRIDAL_SETS",
      "TEMPLE_JEWELLERY_SETS",
      "ANTIQUE_JEWELLERY_COLLECTIONS",
      "CUSTOM_MADE_JEWELLERY"
    ]
  },
  "MATERIAL_GEMSTONE": {
    name: "Shop by Material / Gemstone 💎",
    subCategories: [
      "GOLD_JEWELLERY_22K_18K_14K",
      "SILVER_JEWELLERY_STERLING_OXIDIZED",
      "PLATINUM_JEWELLERY",
      "DIAMOND_JEWELLERY",
      "GEMSTONE_JEWELLERY",
      "PEARL_JEWELLERY",
      "FASHION_ARTIFICIAL_JEWELLERY"
    ]
  }
} as const;

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  subCategory: z.string().optional(),
  material: z.string().optional(),
  priceInr: z.coerce.number(),
  priceBhd: z.coerce.number(),
  grossWeight: z.coerce.number(),
  netWeight: z.coerce.number(),
  purity: z.string().optional(),
  gemstones: z.array(z.string()).default([]),
  size: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]).default("UNISEX"),
  occasion: z.string().optional(),
  stock: z.coerce.number(),
  images: z.array(z.string()).default([]),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return Boolean(val);
  }, z.boolean()).default(true),
  isFeatured: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return Boolean(val);
  }, z.boolean()).default(false),
  isNewArrival: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return Boolean(val);
  }, z.boolean()).default(false),
  // New fields for enhanced pricing calculation
  metalType: z.enum(["GOLD", "SILVER", "DIAMOND", "PEARL", "PLATINUM", "GEMSTONE", "OTHER"]).default("GOLD"),
  isMetalPriceBased: z.coerce.boolean().default(false),
  makingChargesPercentage: z.coerce.number().default(15),
  customPriceInr: z.coerce.number().optional(),
  customPriceBhd: z.coerce.number().optional(),
  // New fields for barcode functionality
  productCode: z.string().optional(),
  stones: z.string().optional().default("None"),
  goldRateAtCreation: z.coerce.number().optional(),
  barcode: z.string().optional(),
  barcodeImageUrl: z.string().optional(),
});

// Estimates schema
export const estimates = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationNo: text("quotation_no").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  purity: text("purity").notNull(),
  grossWeight: decimal("gross_weight", { precision: 8, scale: 2 }).notNull(),
  netWeight: decimal("net_weight", { precision: 8, scale: 2 }).notNull(),
  productCode: text("product_code").notNull(),
  metalValue: decimal("metal_value", { precision: 10, scale: 2 }).notNull(),
  makingChargesPercentage: decimal("making_charges_percentage", { precision: 5, scale: 2 }).notNull(),
  makingCharges: decimal("making_charges", { precision: 10, scale: 2 }).notNull(),
  stoneDiamondChargesPercentage: decimal("stone_diamond_charges_percentage", { precision: 5, scale: 2 }).default("0"),
  stoneDiamondCharges: decimal("stone_diamond_charges", { precision: 10, scale: 2 }).default("0"),
  wastagePercentage: decimal("wastage_percentage", { precision: 5, scale: 2 }).default("2"),
  wastageCharges: decimal("wastage_charges", { precision: 10, scale: 2 }).notNull(),
  hallmarkingCharges: decimal("hallmarking_charges", { precision: 10, scale: 2 }).default("450"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"), // INR or BHD
  validUntil: timestamp("valid_until").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, SENT, ACCEPTED, REJECTED
  sentToWhatsApp: boolean("sent_to_whatsapp").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof estimates.$inferInsert;

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
}).extend({
  validUntil: z.coerce.date(),
});

export const insertCartItemSchema = z.object({
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  productId: z.string(),
  quantity: z.number().min(1).default(1),
});

export const insertOrderSchema = z.object({
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  customerAddress: z.string(),
  currency: z.enum(["INR", "BHD"]),
  subtotal: z.coerce.number(),
  makingCharges: z.coerce.number(),
  gst: z.coerce.number(),
  vat: z.coerce.number().default(0),
  discount: z.coerce.number().default(0),
  shipping: z.coerce.number().default(0),
  total: z.coerce.number(),
  paidAmount: z.coerce.number(),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "STRIPE"]),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    priceInr: z.string(),
    priceBhd: z.string(),
    grossWeight: z.string(),
    netWeight: z.string(),
    makingCharges: z.string(),
    discount: z.string(),
    sgst: z.string(),
    cgst: z.string(),
    vat: z.string(),
    total: z.string(),
  })),
});




export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  billNumber: true
});

export const loginSchema = z.object({
  email: z.string().min(1), // Changed from email() to accept both email and mobile number
  password: z.string().min(1),
});

// OTP schemas for forgot password functionality
export const sendOtpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Category schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const updateCategorySchema = insertCategorySchema.partial().extend({
  id: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
// Custom Home Page Sections Table
export const homeSections = pgTable("home_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  layoutType: text("layout_type").notNull().default("grid"), // 'grid', 'featured', 'mixed'
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").default(0),
  backgroundColor: text("background_color").default("#fff8e1"),
  textColor: text("text_color").default("#8b4513"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Home Section Items (products within a section)
export const homeSectionItems = pgTable("home_section_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull(),
  productId: varchar("product_id").notNull(),
  displayName: text("display_name"), // Custom name for this showcase
  displayPrice: text("display_price"), // Legacy field for backward compatibility
  displayPriceInr: text("display_price_inr"), // Custom price text for INR
  displayPriceBhd: text("display_price_bhd"), // Custom price text for BHD
  position: integer("position").notNull().default(0), // Position in layout
  size: text("size").default("normal"), // 'small', 'normal', 'large' for different grid sizes
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for home sections
export const homeSectionsRelations = relations(homeSections, ({ many }) => ({
  items: many(homeSectionItems),
}));

export const homeSectionItemsRelations = relations(homeSectionItems, ({ one }) => ({
  section: one(homeSections, {
    fields: [homeSectionItems.sectionId],
    references: [homeSections.id],
  }),
  product: one(products, {
    fields: [homeSectionItems.productId],
    references: [products.id],
  }),
}));

// Home Section Schemas
export const insertHomeSectionSchema = createInsertSchema(homeSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHomeSectionItemSchema = createInsertSchema(homeSectionItems).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type InsertHomeSection = z.infer<typeof insertHomeSectionSchema>;
export type InsertHomeSectionItem = z.infer<typeof insertHomeSectionItemSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type HomeSection = typeof homeSections.$inferSelect;
export type HomeSectionItem = typeof homeSectionItems.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;
