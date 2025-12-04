import { Request, Response, NextFunction } from "express";

// MOCK: Simula a extração do JWT e atribui o usuário ao contexto da request.
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Para destravar o Admin e o painel (que exige admin/corretor), forçamos 'admin'.
    (req as any).user = { 
        id: 1, 
        name: "Admin User", 
        email: "admin@casadf.com", 
        role: "admin" 
    };
    next();
};
