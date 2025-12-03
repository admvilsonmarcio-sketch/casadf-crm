import { pgTable, serial, text, integer, decimal, boolean, timestamp, jsonb, pgEnum, numeric, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const contractStatus = pgEnum("contract_status", ["ativo", "encerrado", "pendente"]);

// IMOBILIÁRIA
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
  ownerId: integer("owner_id").references(() => owners.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// FINTECH
export const bankRates = pgTable("bank_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  annualInterestRate: numeric("annual_interest_rate", { precision: 5, scale: 2 }).notNull(),
  maxYears: integer("max_years").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LEADS & CRM (ATUALIZADO)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email"),
  // Dados de Qualificação
  clientType: varchar("client_type", { length: 50 }).default("comprador"),
  qualification: varchar("qualification", { length: 50 }).default("nao_qualificado"),
  stage: varchar("stage", { length: 50 }).default("novo"),
  // Preferências (Colunas reais para filtros)
  budgetMin: numeric("budget_min"),
  budgetMax: numeric("budget_max"),
  preferredNeighborhoods: text("preferred_neighborhoods"),
  // Rastreamento
  interestedPropertyId: integer("interested_property_id"), // NOVO CAMPO
  interestProfile: jsonb("interest_profile"), // Backup JSON
  createdAt: timestamp("created_at").defaultNow(),
});

// INTEGRAÇÃO N8N
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

export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(owners, { fields: [properties.ownerId], references: [owners.id] }),
}));
