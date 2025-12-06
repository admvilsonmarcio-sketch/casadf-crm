import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";

// Define a interface para o payload do JWT (user/role são campos do nosso User)
interface AuthPayload extends JwtPayload {
  userId: number;
  role: 'admin' | 'corretor' | 'cliente' | 'guest';
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['__session']; // Obtém o token do cookie
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
        console.error("ERRO CRÍTICO: JWT_SECRET não está definido.");
        (req as any).user = null;
        return next();
    }

    if (token) {
        try {
            // Verifica e decodifica o token
            const payload = jwt.verify(token, jwtSecret) as AuthPayload;
            
            // Busca o usuário no banco de dados para injetar no contexto
            // Garante que o usuário ainda existe e está ativo
            const user = await db.query.users.findFirst({
                where: eq(users.id, payload.userId),
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                }
            });

            if (user) {
                // Injeta o objeto de usuário (sem dados sensíveis) na requisição
                (req as any).user = user;
            } else {
                res.clearCookie('__session'); // Limpa cookie se usuário não for encontrado
                (req as any).user = null;
            }
        } catch (err) {
            // Token inválido/expirado (JsonWebTokenError, TokenExpiredError)
            res.clearCookie('__session'); // Limpa cookie inválido
            (req as any).user = null;
        }
    } else if (process.env.NODE_ENV === 'development') {
        // MOCK DE ADMIN PARA DEV - Útil para desenvolvimento local sem login
        // Será removido em ambiente de produção (NODE_ENV=production)
        (req as any).user = { 
            id: 1, 
            name: 'Dev Admin (MOCK)',
            email: 'admin@local.dev',
            role: 'admin'
        };
    } else {
        // Em produção, se não houver token válido, o usuário é nulo.
        (req as any).user = null;
    }
    
    next();
};
