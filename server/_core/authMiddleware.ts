import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware de autenticação baseado em JWT.
 *
 * Este middleware lê o cabeçalho `Authorization` no formato
 * `Bearer <token>` e tenta verificar o token usando a chave
 * secreta definida em `process.env.JWT_SECRET`. Se o token for
 * válido, o payload decodificado é atribuído a `req.user` e fica
 * disponível para o restante da aplicação. Caso contrário, o
 * usuário será considerado anônimo e as rotas protegidas irão
 * rejeitá-lo via `protectedProcedure`.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"] as string | undefined;
    const tokenPrefix = "Bearer ";
    // Valor padrão de usuário anônimo
    (req as any).user = null;

    if (authHeader && authHeader.startsWith(tokenPrefix)) {
        const token = authHeader.slice(tokenPrefix.length).trim();
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
            }
            const decoded = jwt.verify(token, secret);
            (req as any).user = decoded;
        } catch (err) {
            // Se o token for inválido ou expirado, mantém usuário como null
            console.warn('Token JWT inválido:', err);
        }
    }
    next();
};
