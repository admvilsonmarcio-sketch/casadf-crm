import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import n8nRouter from "./api/webhooks/n8n";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota de Teste
app.get("/health", (req, res) => res.json({ status: "ok", db: "postgres" }));

// Rotas N8N
app.use("/api/webhooks", n8nRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
