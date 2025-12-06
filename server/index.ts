import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // NOVO: Adicionado cookie-parser
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from "./routers";
import { createContext } from "./_core/trpc";
import n8nRouter from "./api/webhooks/n8n";
import { authMiddleware } from "./_core/authMiddleware";

dotenv.config();
const app = express();

// 1. CORS Corrigido (Restrito em produção) - Fixes #9
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'], // Porta padrão Vite
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Processamento JSON e URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Middleware de Cookies (Necessário para JWT no cookie) - NOVO
app.use(cookieParser());

// 3. Middleware de Autenticação (VITAL para o tRPC context) - Fixes #10
app.use(authMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), user: (req as any).user });
});

// Rota tRPC (VITAL para o Frontend React)
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// Webhooks N8N
app.use("/api/webhooks", n8nRouter);

// 4. Error Handling Global - Fixes #14
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', err);
  // Garante que o cookie de sessão seja removido em caso de erro de autenticação
  if (err.status === 401 || err.code === 'UNAUTHORIZED') {
    res.clearCookie('__session');
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (Deploy Final Ready)`);
});
