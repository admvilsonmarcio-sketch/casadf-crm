import { pgTable, serial, text, integer, timestamp, boolean, jsonb, numeric, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// NÚCLEO IMOBILIÁRIO & FINTECH
// ============================================

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // casa, apartamento, etc
  status: varchar("status", { length: 50 }).notNull(), // venda, aluguel
  address: text("address"),
  ownerId: integer("owner_id"), // Referência lógica (ou FK se tiver tabela owners)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankRates = pgTable("bank_rates", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(), // Taxa anual %
  maxYears: integer("max_years").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  tenantId: integer("tenant_id"), // ID do Lead (Inquilino)
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

// O Coração do CRM Inteligente
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique().notNull(),
  email: text("email"),
  interestProfile: jsonb("interest_profile"), // { "bairros": ["Sul"], "teto": 500000 }
  pipelineStage: varchar("pipeline_stage", { length: 50 }).default("novo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// INFRAESTRUTURA DE AGENTES N8N (Memória de IA)
// ============================================

export const n8nFilaMensagens = pgTable("n8n_fila_mensagens", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // Telefone ou ID único
  mensagem: text("mensagem").notNull(),
  idMensagem: text("id_mensagem").unique(), // Idempotência
  timestamp: timestamp("timestamp").defaultNow(),
  processado: boolean("processado").default(false),
});

export const n8nStatusAtendimento = pgTable("n8n_status_atendimento", {
  sessionId: text("session_id").primaryKey(),
  status: text("status").notNull(), // 'qualificacao', 'humano', 'agendamento'
  ultimoContexto: jsonb("ultimo_contexto"), // Variáveis de estado do N8N
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const n8nChatHistories = pgTable("n8n_chat_histories", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: jsonb("message").notNull(), // { "role": "user", "content": "..." }
  createdAt: timestamp("created_at").defaultNow(),
});

// Relacionamentos para Drizzle Query
export const propertiesRelations = relations(properties, ({ many }) => ({
  contracts: many(contracts),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  property: one(properties, { fields: [contracts.propertyId], references: [properties.id] }),
  movements: many(financialMovements),
}));

export const movementsRelations = relations(financialMovements, ({ one }) => ({
  contract: one(contracts, { fields: [financialMovements.contractId], references: [contracts.id] }),
}));
