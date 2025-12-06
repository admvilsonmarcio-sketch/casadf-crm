import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

const generateSalt = () => randomBytes(16).toString("hex");
const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 64).toString("hex");
const generateToken = () => randomBytes(32).toString("hex");

// Duração do token em segundos (1 dia)
const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;
const TOKEN_EXPIRATION_MS = TOKEN_EXPIRATION_SECONDS * 1000;

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email)
      });

      if (!user || !user.active) {
        throw new Error("Credenciais inválidas ou conta inativa.");
      }

      const inputHash = hashPassword(input.password, user.salt);
      const originalHash = Buffer.from(user.passwordHash, 'hex');
      const verifyHash = Buffer.from(inputHash, 'hex');

      // Comparação time-safe para prevenir ataques de tempo
      if (!timingSafeEqual(originalHash, verifyHash)) {
        throw new Error("Credenciais inválidas.");
      }
      
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
          throw new Error("Erro de servidor: JWT_SECRET não configurado.");
      }

      // 1. Geração do Token JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { 
        expiresIn: TOKEN_EXPIRATION_SECONDS 
      });
      
      // 2. Criação do Cookie de Sessão (HttpOnly e Secure em produção)
      ctx.res.cookie('__session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_EXPIRATION_MS,
      });

      // Retorna objeto de usuário seguro, sem senha/salt
      const { passwordHash, salt, resetToken, resetTokenExpires, ...safeUser } = user;
      return safeUser;
    }),

  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      role: z.enum(['cliente', 'corretor']).default('cliente')
    }))
    .mutation(async ({ input, ctx }) => {
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
      
      // Login automático após registro
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
          const token = jwt.sign({ userId: newUser.id, role: newUser.role }, jwtSecret, { 
            expiresIn: TOKEN_EXPIRATION_SECONDS 
          });
          
          ctx.res.cookie('__session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: TOKEN_EXPIRATION_MS,
          });
      }


      console.log(`[AUTH] Novo usuário registrado: ${input.email}`);
      const { passwordHash: _, salt: __, resetToken, resetTokenExpires, ...safeUser } = newUser;
      return safeUser;
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

  me: protectedProcedure.query(async ({ ctx }) => { // ATUALIZADO para protectedProcedure
    return ctx.user; 
  }),
  
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie('__session');
    return { success: true };
  })
});
