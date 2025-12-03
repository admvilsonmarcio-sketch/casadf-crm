import { pgTable, serial, text, integer, decimal, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const contractStatus = pgEnum("contract_status", ["ativo", "encerrado", "pendente"]);

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
  address: text("address").notNull(),
  price: integer("price").notNull(),
  type: text("type").notNull(),
  status: text("status").default("disponivel"),
  ownerId: integer("owner_id").references(() => owners.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- FINTECH ---
export const bankRates = pgTable("bank_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  annualInterestRate: decimal("annual_interest_rate", { precision: 5, scale: 2 }).notNull(),
  maxYears: integer("max_years").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- INTEGRAÇÃO N8N (CRÍTICO) ---
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email"),
  interestProfile: jsonb("interest_profile"),
  createdAt: timestamp("created_at").defaultNow(),
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
  message: jsonb("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(owners, { fields: [properties.ownerId], references: [owners.id] }),
}));
