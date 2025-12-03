import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { db } from "./db";
import { 
  properties, leads, blogPosts, blogCategories, reviews,
  propertyImages, campaignSources, n8nChatHistories
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const appRouter = router({
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
          .limit(input.limit || 6);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const res = await db.select().from(properties).where(eq(properties.id, input.id));
        return res[0];
      }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
        // Conversão de tipos para Postgres
        const [newProp] = await db.insert(properties).values({
          ...input,
          price: (input.salePrice || input.rentPrice || 0).toString(),
          totalArea: input.totalArea?.toString(),
        }).returning();
        return newProp;
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.delete(properties).where(eq(properties.id, input.id));
        return { success: true };
    })
  }),

  // --- IMAGENS ---
  propertyImages: router({
    list: publicProcedure.input(z.object({ propertyId: z.number() })).query(async ({ input }) => {
        return await db.select().from(propertyImages).where(eq(propertyImages.propertyId, input.propertyId));
    }),
    upload: publicProcedure.input(z.any()).mutation(async ({ input }) => {
        return await db.insert(propertyImages).values(input);
    }),
    setPrimary: publicProcedure.input(z.object({ propertyId: z.number(), imageId: z.number() })).mutation(async ({ input }) => {
        await db.update(propertyImages).set({ isPrimary: 0 }).where(eq(propertyImages.propertyId, input.propertyId));
        await db.update(propertyImages).set({ isPrimary: 1 }).where(eq(propertyImages.id, input.imageId));
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.delete(propertyImages).where(eq(propertyImages.id, input.id));
    })
  }),

  // --- LEADS ---
  leads: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
        await db.insert(leads).values({
            name: input.name,
            email: input.email,
            phone: input.phone,
            interestProfile: { note: input.notes, budget: input.budgetMax }
        });
        return { success: true };
    }),
    getInactiveHotLeads: publicProcedure.query(async () => []), // Mock inicial
  }),

  // --- BLOG ---
  blog: router({
    list: publicProcedure.query(async () => await db.select().from(blogPosts)),
    published: publicProcedure.query(async () => await db.select().from(blogPosts).where(eq(blogPosts.published, true))),
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
        return await db.insert(blogPosts).values(input);
    }),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => {
        await db.update(blogPosts).set(input.data).where(eq(blogPosts.id, input.id));
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
    })
  }),

  // --- REVIEWS & ANALYTICS ---
  reviews: router({
    list: publicProcedure.query(async () => await db.select().from(reviews))
  }),
  analytics: router({
    getMetrics: publicProcedure.query(async () => ({ totalEvents: 0 })),
    listCampaigns: publicProcedure.query(async () => await db.select().from(campaignSources))
  }),
  financial: router({
    getSummary: publicProcedure.query(async () => ({ totalRevenue: 0 }))
  }),
  integration: router({
    getHistory: publicProcedure.input(z.object({ phone: z.string().optional() })).query(async () => [])
  }),
  auth: router({
    me: publicProcedure.query(async () => ({ id: 1, name: "Admin", role: "admin" })),
    logout: publicProcedure.mutation(async () => ({ success: true }))
  })
});

export type AppRouter = typeof appRouter;
