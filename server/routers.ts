import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { db } from "./db";
import { 
  properties, leads, n8nChatHistories, blogPosts, 
  analyticsEvents, campaignSources, financialMovements, propertyImages 
} from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

// Helpers
const getLeadStats = async () => {
  // Mock para dashboard rápido, em produção fazer count real
  return { total: 0, byStage: {} }; 
};

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
        referenceCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [newProp] = await db.insert(properties).values({
          title: input.title,
          description: input.description,
          type: input.propertyType,
          status: input.status,
          price: (input.salePrice || input.rentPrice || 0).toString(),
          address: `${input.neighborhood || ''}, ${input.city || ''} - ${input.state || ''}`,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          parkingSpaces: input.parkingSpaces,
          totalArea: input.totalArea ? input.totalArea.toString() : null,
        }).returning();
        return newProp;
      }),
  }),

  // --- IMAGENS ---
  propertyImages: router({
    list: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return await db.select().from(propertyImages).where(eq(propertyImages.propertyId, input.propertyId));
      }),
    create: publicProcedure
      .input(z.object({
        propertyId: z.number(),
        url: z.string(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const [newImage] = await db.insert(propertyImages).values({
          propertyId: input.propertyId,
          url: input.url,
          order: input.order || 0,
        }).returning();
        return newImage;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(propertyImages).where(eq(propertyImages.id, input.id));
        return { success: true };
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
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        preferredNeighborhoods: z.string().optional(),
        propertyInterest: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
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
          source: input.source || 'site',
          interestProfile: interestProfile,
          pipelineStage: "novo"
        }).returning();
        return newLead;
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          stage: z.string().optional(),
          notes: z.string().optional(),
        })
      }))
      .mutation(async ({ input }) => {
        if (input.data.stage) {
          await db.update(leads)
            .set({ pipelineStage: input.data.stage, updatedAt: new Date() })
            .where(eq(leads.id, input.id));
        }
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(leads).where(eq(leads.id, input.id));
        return { success: true };
      }),
  }),

  // --- BLOG ---
  blog: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug));
        return result[0];
      }),
    create: publicProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        featuredImage: z.string().optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const slug = input.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const [post] = await db.insert(blogPosts).values({
          ...input,
          slug,
          publishedAt: input.published ? new Date() : null,
        }).returning();
        return post;
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          content: z.string().optional(),
          published: z.boolean().optional(),
        })
      }))
      .mutation(async ({ input }) => {
        await db.update(blogPosts)
          .set({
            ...input.data,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, input.id));
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
        return { success: true };
      }),
  }),

  // --- ANALYTICS ---
  analytics: router({
    getMetrics: publicProcedure.query(async () => {
      // Agregação real via SQL
      const totalEvents = await db.select({ count: sql<number>`count(*)` }).from(analyticsEvents);
      
      // Simulação para preencher o dashboard enquanto não há dados suficientes
      return {
        totalEvents: Number(totalEvents[0].count),
        eventsByType: {
          page_view: 120,
          property_view: 45,
          contact_form: 5,
          whatsapp_click: 12
        },
        eventsBySource: {
          google: 60,
          direct: 40,
          instagram: 20
        }
      };
    }),
    listCampaigns: publicProcedure.query(async () => {
      return await db.select().from(campaignSources);
    }),
    trackEvent: publicProcedure
      .input(z.object({
        eventType: z.string(),
        source: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const [event] = await db.insert(analyticsEvents).values({
          eventType: input.eventType,
          source: input.source,
          metadata: input.metadata,
        }).returning();
        return event;
      }),
  }),

  // --- FINANCEIRO ---
  financial: router({
    getSummary: publicProcedure.query(async () => {
      // Em produção, fazer sum() na tabela financialMovements
      return {
        totalRevenue: 150000.00,
        totalCommissions: 12500.00,
        pendingCommissions: 4500.00,
        netProfit: 98000.00
      };
    }),
    getMovements: publicProcedure.query(async () => {
      return await db.select().from(financialMovements).orderBy(desc(financialMovements.dueDate));
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
