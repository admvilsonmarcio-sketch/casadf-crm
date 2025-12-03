import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { db } from "./db";
import { 
  properties, leads, blogPosts, blogCategories, reviews,
  analyticsEvents, campaignSources, financialMovements, propertyImages,
  n8nChatHistories, owners, users
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const appRouter = router({
  // --- USERS (EQUIPE) ---
  users: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(users).orderBy(desc(users.createdAt));
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [newUser] = await db.insert(users).values(input).returning();
      return newUser;
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    })
  }),

  // --- OWNERS (PROPRIETÁRIOS) ---
  owners: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(owners).orderBy(desc(owners.createdAt));
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [newOwner] = await db.insert(owners).values(input).returning();
      return newOwner;
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(owners).where(eq(owners.id, input.id));
      return { success: true };
    })
  }),

  // --- IMÓVEIS ---
  properties: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(properties).orderBy(desc(properties.createdAt));
    }),
    featured: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.select().from(properties)
          .where(eq(properties.featured, true))
          .limit(input.limit || 6)
          .orderBy(desc(properties.createdAt));
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const result = await db.select().from(properties).where(eq(properties.id, input.id));
        return result[0];
      }),
    create: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        const [newProp] = await db.insert(properties).values({
          ...input,
          price: (input.salePrice || input.rentPrice || 0).toString(),
          totalArea: input.totalArea ? input.totalArea.toString() : null,
        }).returning();
        return newProp;
      }),
    update: publicProcedure
      .input(z.object({ id: z.number(), data: z.any() }))
      .mutation(async ({ input }) => {
        await db.update(properties).set(input.data).where(eq(properties.id, input.id));
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(properties).where(eq(properties.id, input.id));
        return { success: true };
      }),
  }),

  // --- IMAGENS ---
  propertyImages: router({
    list: publicProcedure.input(z.object({ propertyId: z.number() })).query(async ({ input }) => {
      return await db.select().from(propertyImages).where(eq(propertyImages.propertyId, input.propertyId));
    }),
    upload: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [img] = await db.insert(propertyImages).values(input).returning();
      return img;
    }),
    setPrimary: publicProcedure.input(z.object({ propertyId: z.number(), imageId: z.number() })).mutation(async ({ input }) => {
      await db.update(propertyImages).set({ isPrimary: 0 }).where(eq(propertyImages.propertyId, input.propertyId));
      await db.update(propertyImages).set({ isPrimary: 1 }).where(eq(propertyImages.id, input.imageId));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(propertyImages).where(eq(propertyImages.id, input.id));
      return { success: true };
    })
  }),

  // --- LEADS ---
  leads: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const res = await db.select().from(leads).where(eq(leads.id, input.id));
      return res[0];
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [lead] = await db.insert(leads).values({
        ...input,
        budgetMin: input.budgetMin ? String(input.budgetMin) : null,
        budgetMax: input.budgetMax ? String(input.budgetMax) : null,
        stage: input.stage || 'novo'
      }).returning();
      return lead;
    }),
    update: publicProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      await db.update(leads).set(input.data).where(eq(leads.id, input.id));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(leads).where(eq(leads.id, input.id));
      return { success: true };
    }),
    getInactiveHotLeads: publicProcedure.query(async () => {
      const allLeads = await db.select().from(leads).where(eq(leads.qualification, 'quente'));
      return allLeads.map(l => ({ ...l, daysSinceLastContact: 5, lastContactDate: new Date() }));
    }),
    matchProperties: publicProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
        const lead = (await db.select().from(leads).where(eq(leads.id, input.leadId)))[0];
        const props = await db.select().from(properties).limit(5);
        return { lead, properties: props };
    }),
  }),

  // --- BLOG ---
  blog: router({
    list: publicProcedure.query(async () => await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt))),
    published: publicProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ input }) => {
      return await db.select().from(blogPosts).where(eq(blogPosts.published, true)).limit(input?.limit || 10);
    }),
    categories: publicProcedure.query(async () => await db.select().from(blogCategories)),
    getPostBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const res = await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug));
      return res[0];
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const res = await db.select().from(blogPosts).where(eq(blogPosts.id, input.id));
      return res[0];
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [post] = await db.insert(blogPosts).values(input).returning();
      return post;
    }),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      await db.update(blogPosts).set(input.data).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    })
  }),

  // --- REVIEWS ---
  reviews: router({
    list: publicProcedure.query(async () => await db.select().from(reviews).where(eq(reviews.active, true))),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
        const [rev] = await db.insert(reviews).values(input).returning();
        return rev;
    })
  }),

  // --- ANALYTICS ---
  analytics: router({
    getMetrics: publicProcedure.input(z.any()).query(async () => ({ 
        totalEvents: 0, 
        eventsByType: { page_view: 0, property_view: 0, contact_form: 0, whatsapp_click: 0 },
        eventsBySource: { google: 0, direct: 0 }
    })),
    listCampaigns: publicProcedure.query(async () => await db.select().from(campaignSources))
  }),

  // --- FINANCEIRO ---
  financial: router({
    getSummary: publicProcedure.query(async () => ({ 
        totalRevenue: 0, totalCommissions: 0, pendingCommissions: 0, netProfit: 0 
    }))
  }),

  // --- INTEGRAÇÃO ---
  integration: router({
    getHistory: publicProcedure.input(z.object({ phone: z.string().optional(), sessionId: z.string().optional(), limit: z.number().optional() })).query(async ({ input }) => {
        if(!input.phone && !input.sessionId) return [];
        return await db.select().from(n8nChatHistories)
            .where(eq(n8nChatHistories.sessionId, input.sessionId || input.phone!))
            .orderBy(desc(n8nChatHistories.createdAt))
            .limit(input.limit || 50);
    }),
    matchPropertiesForClient: publicProcedure.input(z.any()).mutation(async () => ({ success: true, properties: [] })),
    updateLeadQualification: publicProcedure.input(z.any()).mutation(async () => ({ success: true })),
    saveLeadFromWhatsApp: publicProcedure.input(z.any()).mutation(async () => ({ success: true })),
    whatsappWebhook: publicProcedure.input(z.any()).mutation(async () => ({ success: true }))
  }),

  // --- AUTH ---
  auth: router({
    me: publicProcedure.query(async () => {
      return { id: 1, name: "Admin", email: "admin@casadf.com", role: "admin" };
    }),
    logout: publicProcedure.mutation(async () => ({ success: true }))
  })
});

export type AppRouter = typeof appRouter;
