import { pgTable, serial, text, integer, boolean, timestamp, jsonb, numeric, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- IMOBILIÁRIA ---
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 20 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
  rentPrice: numeric("rent_price", { precision: 12, scale: 2 }),
  type: varchar("type", { length: 50 }).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).default("venda"),
  status: varchar("status", { length: 50 }).default("disponivel"),
  features: jsonb("features"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parkingSpaces: integer("parking_spaces"),
  totalArea: numeric("total_area"),
  mainImage: text("main_image"),
  images: jsonb("images"),
  featured: boolean("featured").default(false),
  referenceCode: text("reference_code"),
  ownerId: integer("owner_id").references(() => owners.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  imageUrl: text("image_url").notNull(),
  imageKey: text("image_key"),
  caption: text("caption"),
  isPrimary: integer("is_primary").default(0),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- BLOG ---
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  categoryId: integer("category_id").references(() => blogCategories.id),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- REVIEWS & SOCIAL ---
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  title: text("title"),
  clientName: text("client_name").notNull(),
  clientRole: text("client_role"),
  clientPhoto: text("client_photo"),
  rating: integer("rating").default(5),
  content: text("content"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CRM & LEADS ---
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  source: text("source"),
  clientType: varchar("client_type", { length: 50 }),
  qualification: varchar("qualification", { length: 50 }).default("nao_qualificado"),
  stage: varchar("stage", { length: 50 }).default("novo"),
  urgencyLevel: varchar("urgency_level", { length: 50 }),
  buyerProfile: varchar("buyer_profile", { length: 50 }),
  transactionInterest: varchar("transaction_interest", { length: 50 }),
  budgetMin: numeric("budget_min"),
  budgetMax: numeric("budget_max"),
  preferredNeighborhoods: text("preferred_neighborhoods"),
  preferredPropertyTypes: text("preferred_property_types"),
  notes: text("notes"),
  tags: text("tags"),
  interestedPropertyId: integer("interested_property_id"),
  interestProfile: jsonb("interest_profile"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- ANALYTICS & FINTECH ---
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  source: text("source"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignSources = pgTable("campaign_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  medium: text("medium"),
  budget: numeric("budget"),
  conversions: integer("conversions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financialMovements = pgTable("financial_movements", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status", { length: 20 }).default("pendente"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankRates = pgTable("bank_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  maxYears: integer("max_years").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- N8N INTEGRATION ---
export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  mensagem: text("mensagem"),
  idMensagem: text("id_mensagem").unique(),
  processado: boolean("processado").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const n8nChatHistories = pgTable("n8n_chat_histories", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").default("user"),
  message: jsonb("message").notNull(),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RELATIONS ---
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(owners, { fields: [properties.ownerId], references: [owners.id] }),
  images: many(propertyImages),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, { fields: [propertyImages.propertyId], references: [properties.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, { fields: [blogPosts.categoryId], references: [blogCategories.id] }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));
