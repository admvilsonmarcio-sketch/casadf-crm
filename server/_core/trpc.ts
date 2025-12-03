import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import superjson from 'superjson';
import { ZodError } from 'zod';

export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
  // Mock para contexto de Auth
  return { req, res, user: { id: 1, role: 'admin' } }; 
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

// Mock de segurança: Rotas protegidas exigirão autenticação real (via JWT no futuro)
export const protectedProcedure = t.procedure.use(async ({ next }) => {
    // if (context.user.role !== 'admin') throw new TRPCError({ code: 'UNAUTHORIZED' });
    return next();
});
