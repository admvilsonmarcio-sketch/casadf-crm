import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const generateSalt = () => randomBytes(16).toString("hex");
const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 64).toString("hex");
const generateToken = () => randomBytes(32).toString("hex");

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      });

      if (!user || !user.active) {
        throw new Error("Credenciais inválidas ou conta inativa.");
      }

      const inputHash = hashPassword(input.password, user.salt);
      const originalHash = Buffer.from(user.passwordHash, 'hex');
      const verifyHash = Buffer.from(inputHash, 'hex');

      if (!timingSafeEqual(originalHash, verifyHash)) {
        throw new Error("Credenciais inválidas.");
      }

      const { passwordHash, salt, resetToken, ...safeUser } = user;
      // Gerar token JWT com informações essenciais do usuário
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET não configurado.');
      }
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        secret,
        { expiresIn: '7d' }
      );
      return { user: safeUser, token };
    }),

  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      role: z.enum(['cliente', 'corretor']).default('cliente')
    }))
    .mutation(async ({ input }) => {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      });

      if (existing) {
        throw new Error("Email já cadastrado.");
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(input.password, salt);

      const [newUser] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        salt,
        role: input.role,
        phone: input.phone,
        active: true
      }).returning();

      console.log(`[AUTH] Novo usuário registrado: ${input.email}`);
      const { passwordHash: _, salt: __, ...safeUser } = newUser;
      // Gerar token para o usuário recém-criado
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET não configurado.');
      }
      const token = jwt.sign(
        {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        secret,
        { expiresIn: '7d' }
      );
      return { user: safeUser, token };
    }),

  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      });

      if (user) {
        const token = generateToken().substring(0, 6).toUpperCase();
        const expires = new Date(Date.now() + 3600000);

        await db.update(users)
          .set({ resetToken: token, resetTokenExpires: expires })
          .where(eq(users.id, user.id));

        console.log(`[AUTH] Código de recuperação para ${input.email}: ${token}`);
      }
      return { success: true, message: "Se o email existir, um código foi enviado." };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string(),
      newPassword: z.string().min(6)
    }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      });

      if (!user || user.resetToken !== input.code) {
        throw new Error("Código inválido ou expirado.");
      }

      if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
        throw new Error("Código expirado.");
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(input.newPassword, salt);

      await db.update(users)
        .set({ passwordHash, salt, resetToken: null, resetTokenExpires: null })
        .where(eq(users.id, user.id));

      return { success: true };
    }),

  // Retorna os dados do usuário autenticado. Se não houver usuário no
  // contexto, uma exceção é lançada pelo `protectedProcedure`.
  me: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user é definido pelo authMiddleware ao validar o JWT
    return ctx.user;
  }),
  
  logout: publicProcedure.mutation(async () => {
    return { success: true };
  })
});
