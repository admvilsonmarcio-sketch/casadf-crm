import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from "./routers";
import { createContext } from "./_core/trpc";
import n8nRouter from "./api/webhooks/n8n";

dotenv.config();
const app = express();

// Configuração CORS e JSON
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota tRPC (VITAL para o Frontend React)
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// Webhooks N8N
app.use("/api/webhooks", n8nRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (Deploy Final Ready)`);
});
