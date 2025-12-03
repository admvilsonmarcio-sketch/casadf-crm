import { pgTable, serial, text, integer, boolean, timestamp, jsonb, numeric, varchar, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const contractStatus = pgEnum("contract_status", ["ativo", "encerrado", "pendente"]);

// --- AUTENTICAÇÃO ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  role: varchar("role", { length: 20 }).default("cliente"),
  avatar: text("avatar"),
  phone: text("phone"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- IMÓVEIS ---
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
  address: text("address").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("disponivel"),
  transactionType: varchar("transaction_type", { length: 50 }).default("venda"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 20 }),
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
});

export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  imageUrl: text("image_url").notNull(),
  isPrimary: integer("is_primary").default(0),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- BLOG & CONTEÚDO ---
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
  published: boolean("published").default(false),
  views: integer("views").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientRole: text("client_role"),
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
  interestProfile: jsonb("interest_profile"),
  budgetMin: numeric("budget_min"),
  budgetMax: numeric("budget_max"),
  preferredNeighborhoods: text("preferred_neighborhoods"),
  interestedPropertyId: integer("interested_property_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- FINTECH & N8N ---
export const bankRates = pgTable("bank_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  maxYears: integer("max_years").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  mensagem: text("mensagem"),
  idMensagem: text("id_mensagem").unique(),
  processado: boolean("processado").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const n8nStatusAtendimento = pgTable("n8n_status_atendimento", {
  sessionId: text("session_id").primaryKey(),
  status: text("status").notNull(),
  ultimoContexto: jsonb("ultimo_contexto"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const n8nChatHistories = pgTable("n8n_chat_histories", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").default("user"),
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const propertiesRelations = relations(properties, ({ many, one }) => ({
  images: many(propertyImages),
  owner: one(owners, { fields: [properties.ownerId], references: [owners.id] }),
}));
