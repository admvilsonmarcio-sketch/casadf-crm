import { pgTable, serial, text, integer, timestamp, boolean, jsonb, numeric, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// 1. NÚCLEO IMOBILIÁRIO & FINTECH
// ============================================

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  address: text("address"),
  ownerId: integer("owner_id"),
  features: jsonb("features"), // Adicionado para suportar lista de caracteristicas
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parkingSpaces: integer("parking_spaces"),
  totalArea: numeric("total_area"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  url: text("url").notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankRates = pgTable("bank_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  maxYears: integer("max_years").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  tenantId: integer("tenant_id"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  rentValue: numeric("rent_value", { precision: 12, scale: 2 }).notNull(),
  active: boolean("active").default(true),
});

export const financialMovements = pgTable("financial_movements", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id),
  type: varchar("type", { length: 20 }).notNull(), // receita, despesa
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at"),
});

// ============================================
// 2. CRM & ADMINISTRAÇÃO
// ============================================

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email"),
  source: text("source"), // Adicionado para rastreamento
  interestProfile: jsonb("interest_profile"),
  pipelineStage: varchar("pipeline_stage", { length: 50 }).default("novo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // page_view, click, lead
  source: varchar("source", { length: 50 }), // google, facebook, direct
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaignSources = pgTable("campaign_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  medium: text("medium"),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  conversions: integer("conversions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// 3. INFRAESTRUTURA DE AGENTES N8N
// ============================================

export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  mensagem: text("mensagem").notNull(),
  idMensagem: text("id_mensagem").unique(),
  timestamp: timestamp("timestamp").defaultNow(),
  processado: boolean("processado").default(false),
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
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// RELACIONAMENTOS
// ============================================

export const propertiesRelations = relations(properties, ({ many }) => ({
  contracts: many(contracts),
  images: many(propertyImages),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, { fields: [propertyImages.propertyId], references: [properties.id] }),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  property: one(properties, { fields: [contracts.propertyId], references: [properties.id] }),
  movements: many(financialMovements),
}));

export const movementsRelations = relations(financialMovements, ({ one }) => ({
  contract: one(contracts, { fields: [financialMovements.contractId], references: [contracts.id] }),
}));
