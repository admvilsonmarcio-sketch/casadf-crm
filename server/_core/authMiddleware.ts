import { Request, Response, NextFunction } from "express";

// MOCK: Simula a extração do JWT e atribui o usuário ao contexto da request.
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    (req as any).user = { 
        id: 1, 
        name: 'Admin',
        email: 'admin@local.dev',
        role: 'admin'
    };
    next();
};
