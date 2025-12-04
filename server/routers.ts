import { z } from "zod";
import { router, publicProcedure, adminProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./db";
import { authRouter } from "./routers/auth";
import { simulate } from "./services/financingCalculator";
import { 
  properties, leads, blogPosts, blogCategories, reviews,
  analyticsEvents, campaignSources, financialMovements, propertyImages,
  n8nChatHistories, owners, users, bankRates
} from "../drizzle/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Esquemas de validação (Zod) - CRÍTICO: Elimina z.any() em mutações
const leadCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8, "Telefone inválido").optional().or(z.literal('')),
  qualification: z.enum(['quente', 'morno', 'frio', 'nao_qualificado']).default('nao_qualificado').optional(),
  stage: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  notes: z.string().optional(),
  interestedPropertyId: z.number().optional(),
});

const propertyCreateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  propertyType: z.string(),
  transactionType: z.string(),
  salePrice: z.number().optional(),
  rentPrice: z.number().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  parkingSpaces: z.number().optional(),
  totalArea: z.number().optional(),
  status: z.string().default("disponivel"),
  featured: z.boolean().optional(),
});

// Schema para o novo simulador
const simulationSchema = z.object({
    propertyValue: z.number().min(1000, "Valor do imóvel inválido."),
    downPayment: z.number().min(0),
    years: z.number().min(5).max(35, "Prazo máximo de 35 anos"),
    clientName: z.string().min(1),
    clientEmail: z.string().email(),
    clientPhone: z.string(),
    bankId: z.number().optional(),
});


export const appRouter = router({
  auth: authRouter,

  // Rotas CRUD que eram públicas AGORA usam adminProcedure - Fixes #2
  users: router({
    list: adminProcedure.query(async () => {
      return await db.select().from(users).orderBy(desc(users.createdAt));
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Criação de usuário via API desabilitada para Admin.' });
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    })
  }),

  owners: router({
    list: adminProcedure.query(async () => {
      return await db.select().from(owners).orderBy(desc(owners.createdAt));
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const [newOwner] = await db.insert(owners).values(input).returning();
      return newOwner;
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(owners).where(eq(owners.id, input.id));
      return { success: true };
    })
  }),

  // --- IMÓVEIS (Usa esquema estrito) ---
  properties: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(properties).orderBy(desc(properties.createdAt));
    }),
    featured: publicProcedure.query(async () => {
      return await db.select().from(properties).where(eq(properties.featured, true)).limit(6);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const result = await db.select().from(properties).where(eq(properties.id, input.id));
      return result[0];
    }),
    create: adminProcedure.input(propertyCreateSchema).mutation(async ({ input }) => { // USANDO SCHEMA
      const [newProp] = await db.insert(properties).values({
        ...input,
        price: (input.salePrice || input.rentPrice || 0).toString(),
        totalArea: input.totalArea ? input.totalArea.toString() : null,
        salePrice: input.salePrice,
        rentPrice: input.rentPrice,
      }).returning();
      return newProp;
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      await db.update(properties).set(input.data).where(eq(properties.id, input.id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(properties).where(eq(properties.id, input.id));
      return { success: true };
    }),
  }),

  propertyImages: router({
    list: publicProcedure.input(z.object({ propertyId: z.number() })).query(async ({ input }) => {
      return await db.select().from(propertyImages).where(eq(propertyImages.propertyId, input.propertyId));
    }),
    upload: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const [img] = await db.insert(propertyImages).values(input).returning();
      return img;
    }),
    setPrimary: adminProcedure.input(z.object({ propertyId: z.number(), imageId: z.number() })).mutation(async ({ input }) => {
      await db.update(propertyImages).set({ isPrimary: 0 }).where(eq(propertyImages.propertyId, input.propertyId));
      await db.update(propertyImages).set({ isPrimary: 1 }).where(eq(propertyImages.id, input.imageId));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(propertyImages).where(eq(propertyImages.id, input.id));
      return { success: true };
    })
  }),

  // --- LEADS (Usa esquema estrito) ---
  leads: router({
    list: adminProcedure.query(async () => {
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
    }),
    create: publicProcedure.input(leadCreateSchema).mutation(async ({ input }) => { // USANDO SCHEMA
      const [lead] = await db.insert(leads).values({
        ...input,
        budgetMin: input.budgetMin ? String(input.budgetMin) : null,
        budgetMax: input.budgetMax ? String(input.budgetMax) : null,
        stage: input.stage || 'novo'
      }).returning();
      return lead;
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      await db.update(leads).set(input.data).where(eq(leads.id, input.id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(leads).where(eq(leads.id, input.id));
      return { success: true };
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const res = await db.select().from(leads).where(eq(leads.id, input.id));
      return res[0];
    }),
    getInactiveHotLeads: adminProcedure.query(async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const hotLeads = await db.select()
        .from(leads)
        .where(and(
          eq(leads.qualification, 'quente'),
          lt(leads.updatedAt, threeDaysAgo) 
        ));
        
      return hotLeads.map(l => ({
          ...l,
          daysSinceLastContact: Math.floor((Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
          lastContactDate: l.updatedAt
      }));
    }),
    matchProperties: adminProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
        const lead = await db.query.leads.findFirst({ where: eq(leads.id, input.leadId) });
        const props = await db.select().from(properties).limit(5); 
        return { lead, properties: props };
    }),
  }),

  // --- MÓDULO FINANCEIRO (Adiciona Simulador) ---
  financial: router({
    getSummary: publicProcedure.query(async () => ({ totalRevenue: 0, totalCommissions: 0, pendingCommissions: 0, netProfit: 0 })),
    
    // Rota para o novo simulador
    simulate: publicProcedure.input(simulationSchema).mutation(async ({ input }) => {
        const bankRatesList = await db.select().from(bankRates);
        
        const simulationResults = await Promise.all(bankRatesList.map(async (bank) => {
            const rate = Number(bank.annualInterestRate);
            const result = await simulate({ 
                propertyValue: input.propertyValue,
                downPayment: input.downPayment,
                years: input.years,
                bankId: bank.id, 
            });
            
            return {
                bankName: bank.bankName,
                rate: rate,
                maxYears: bank.maxYears,
                result: result.system,
            };
        }));

        const [lead] = await db.insert(leads).values({
            name: input.clientName,
            email: input.clientEmail,
            phone: input.clientPhone,
            source: 'simulador_imobiliario',
            qualification: 'morno',
            notes: `Simulação de financiamento iniciada para imóvel de R$ ${input.propertyValue} em ${input.years} anos.`,
            budgetMax: String(input.propertyValue * 100),
        }).returning();

        return { success: true, results: simulationResults, leadId: lead.id };
    }),

    getRates: publicProcedure.query(async () => {
        return await db.select().from(bankRates);
    }),
  }),
  
  // --- BLOG ---
  blog: router({
    list: adminProcedure.query(async () => await db.select().from(blogPosts)),
    published: publicProcedure.query(async () => await db.select().from(blogPosts).where(eq(blogPosts.published, true))),
    categories: publicProcedure.query(async () => await db.select().from(blogCategories)),
    getPostBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const res = await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug));
      return res[0];
    }),
    create: adminProcedure.input(z.any()).mutation(async ({ input }) => {
      const [post] = await db.insert(blogPosts).values(input).returning();
      return post;
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      await db.update(blogPosts).set(input.data).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    })
  }),

  reviews: router({
    list: publicProcedure.query(async () => await db.select().from(reviews).where(eq(reviews.active, true))),
  }),

  analytics: router({
    getMetrics: publicProcedure.query(async () => ({ totalEvents: 0, eventsByType: { property_view: 0, contact_form: 0, whatsapp_click: 0 }, eventsBySource: { google: 0, direct: 0 }})),
    listCampaigns: publicProcedure.query(async () => []),
  }),

  integration: router({
    getHistory: publicProcedure.input(z.any()).query(async () => [])
  }),
});

export type AppRouter = typeof appRouter;
