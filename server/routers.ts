import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { db } from "./db";
import { properties, leads, bankRates, n8nChatHistories } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { simulate } from "./services/financingCalculator";

// --- SUB-ROUTER: PROPERTIES ---
const propertiesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }),
  
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db.select().from(properties).where(eq(properties.id, input.id));
      return result[0];
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
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
    }))
    .mutation(async ({ input }) => {
      // Mapeamento simples: Frontend -> DB
      const [newProp] = await db.insert(properties).values({
        title: input.title,
        description: input.description,
        price: (input.salePrice || input.rentPrice || 0).toString(),
        type: input.propertyType,
        status: input.status,
        address: `${input.neighborhood || ''}, ${input.city || ''}`,
      }).returning();
      return newProp;
    }),
    
  featured: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.select().from(properties).limit(input.limit || 6);
    }),
});

// --- SUB-ROUTER: LEADS (Onde a mágica acontece) ---
const leadsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      // Campos antigos que o Frontend envia
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      preferredNeighborhoods: z.string().optional(),
      propertyInterest: z.string().optional(),
      message: z.string().optional(), 
      source: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // ADAPTER: Converte campos soltos para o JSONB 'interestProfile'
      const interestProfile = {
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        neighborhoods: input.preferredNeighborhoods,
        type: input.propertyInterest,
        originalMessage: input.message
      };

      // Se não tiver telefone, usa um placeholder ou gera erro (depende da regra de negócio)
      const phoneKey = input.phone || `no-phone-${Date.now()}`;

      const [newLead] = await db.insert(leads).values({
        name: input.name,
        email: input.email,
        phone: phoneKey,
        interestProfile: interestProfile, // Salvando o JSON estruturado
        pipelineStage: "novo"
      }).returning();
      
      return newLead;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db.select().from(leads).where(eq(leads.id, input.id));
      return result[0];
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      preferredNeighborhoods: z.string().optional(),
      propertyInterest: z.string().optional(),
      pipelineStage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      // Monta o interestProfile se houver campos de interesse
      const interestProfile = {
        budgetMin: updateData.budgetMin,
        budgetMax: updateData.budgetMax,
        neighborhoods: updateData.preferredNeighborhoods,
        type: updateData.propertyInterest,
      };

      const [updatedLead] = await db.update(leads)
        .set({
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phone,
          interestProfile: interestProfile,
          pipelineStage: updateData.pipelineStage,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))
        .returning();

      return updatedLead;
    }),
});

// --- SUB-ROUTER: FINANCING ---
const financingRouter = router({
  simulate: publicProcedure
    .input(z.object({
      propertyValue: z.number(),
      downPayment: z.number(),
      years: z.number(),
      bankId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await simulate(input);
    }),

  getBankRates: publicProcedure.query(async () => {
    return await db.select().from(bankRates);
  }),
});

// --- SUB-ROUTER: INTEGRATION (N8N) ---
const integrationRouter = router({
  getHistory: publicProcedure
    .input(z.object({ phone: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.phone) return [];
      return await db.select()
        .from(n8nChatHistories)
        .where(eq(n8nChatHistories.sessionId, input.phone))
        .orderBy(desc(n8nChatHistories.createdAt));
    })
});

// --- APP ROUTER PRINCIPAL ---
export const appRouter = router({
  properties: propertiesRouter,
  leads: leadsRouter,
  financing: financingRouter,
  integration: integrationRouter,
});

export type AppRouter = typeof appRouter;
