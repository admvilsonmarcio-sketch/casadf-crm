import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from "./routers";
import { createContext } from "./_core/trpc";
import n8nRouter from "./api/webhooks/n8n";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rota tRPC (Site)
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// Rota Webhook (N8N)
app.use("/api/webhooks", n8nRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
