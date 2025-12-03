import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { db } from "./db";
import { authRouter } from "./routers/auth";
import { 
  properties, leads, blogPosts, blogCategories, reviews,
  analyticsEvents, campaignSources, financialMovements, propertyImages,
  n8nChatHistories, owners, users
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const appRouter = router({
  auth: authRouter,

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

  properties: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(properties).orderBy(desc(properties.createdAt));
    }),
    featured: publicProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
      return await db.select().from(properties).where(eq(properties.featured, true)).limit(input.limit || 6);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const result = await db.select().from(properties).where(eq(properties.id, input.id));
      return result[0];
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [newProp] = await db.insert(properties).values({
        ...input,
        price: (input.salePrice || input.rentPrice || 0).toString(),
      }).returning();
      return newProp;
    }),
    update: publicProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      await db.update(properties).set(input.data).where(eq(properties.id, input.id));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(properties).where(eq(properties.id, input.id));
      return { success: true };
    }),
  }),

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

  leads: router({
    list: publicProcedure.query(async () => {
      return await db.select().from(leads).orderBy(desc(leads.createdAt));
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
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const res = await db.select().from(leads).where(eq(leads.id, input.id));
      return res[0];
    }),
    getInactiveHotLeads: publicProcedure.query(async () => {
      return [];
    }),
    matchProperties: publicProcedure.input(z.object({ leadId: z.number() })).query(async () => ({ lead: null, properties: [] })),
  }),

  blog: router({
    list: publicProcedure.query(async () => await db.select().from(blogPosts)),
    published: publicProcedure.query(async () => await db.select().from(blogPosts).where(eq(blogPosts.published, true))),
    categories: publicProcedure.query(async () => await db.select().from(blogCategories)),
    getPostBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const res = await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug));
      return res[0];
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const [post] = await db.insert(blogPosts).values(input).returning();
      return post;
    }),
    update: publicProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(async ({ input }) => {
      await db.update(blogPosts).set(input.data).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    })
  }),

  reviews: router({
    list: publicProcedure.query(async () => await db.select().from(reviews).where(eq(reviews.active, true))),
  }),

  analytics: router({
    getMetrics: publicProcedure.query(async () => ({ totalEvents: 0 })),
    listCampaigns: publicProcedure.query(async () => []),
  }),

  financial: router({
    getSummary: publicProcedure.query(async () => ({ totalRevenue: 0 })),
  }),

  integration: router({
    getHistory: publicProcedure.input(z.any()).query(async () => [])
  }),
});

export type AppRouter = typeof appRouter;
