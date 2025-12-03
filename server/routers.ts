import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { db } from "./db";
import { properties, leads, n8nChatHistories } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const appRouter = router({
  // --- IMÓVEIS ---
  properties: router({
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
        referenceCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [newProp] = await db.insert(properties).values({
          title: input.title,
          description: input.description,
          type: input.propertyType,
          status: input.status,
          price: (input.salePrice || input.rentPrice || 0).toString(), // Convertendo para string/numeric do PG
          address: `${input.neighborhood || ''}, ${input.city || ''} - ${input.state || ''}`,
        }).returning();
        return newProp;
      }),
  }),

  // --- LEADS (CRM) ---
  leads: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        message: z.string().optional(),
        // Campos de filtro do Frontend (Adaptador para JSONB)
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        preferredNeighborhoods: z.string().optional(),
        propertyInterest: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // ADAPTER: Converte inputs soltos para o objeto JSONB
        const interestProfile = {
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          neighborhoods: input.preferredNeighborhoods,
          propertyType: input.propertyInterest,
          message: input.message
        };
        
        const phone = input.phone || `no-phone-${Date.now()}`;

        const [newLead] = await db.insert(leads).values({
          name: input.name,
          email: input.email,
          phone: phone,
          interestProfile: interestProfile, // Salvando como JSON
          pipelineStage: "novo"
        }).returning();
        return newLead;
      }),
  }),

  // --- INTEGRAÇÃO ---
  integration: router({
    getHistory: publicProcedure
      .input(z.object({ phone: z.string().optional() }))
      .query(async ({ input }) => {
        if (!input.phone) return [];
        return await db.select().from(n8nChatHistories)
          .where(eq(n8nChatHistories.sessionId, input.phone));
      })
  })
});

export type AppRouter = typeof appRouter;
