import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import superjson from 'superjson';
import { ZodError } from 'zod';

export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
  return { req, res, user: (req as any).user }; 
};
type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// 1. Procedimento Protegido (Requer login)
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
    if (!ctx.user || !ctx.user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: "Requer autenticação." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

// 2. Procedimento de Administrador (Requer role: admin/corretor)
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'corretor') {
        throw new TRPCError({ code: 'FORBIDDEN', message: "Acesso restrito a administradores/corretores." });
    }
    return next();
});
