import { Router } from "express";
import { db } from "../../db";
import { leads, n8nChatHistories } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/leads/ingest", async (req, res) => {
  try {
    // O N8N pode enviar dados estruturados agora
    const { 
      name, phone, email, 
      qualification, stage, client_type, // Dados de CRM
      budget_min, budget_max, neighborhoods, // Dados de Perfil
      message_log, interest_profile 
    } = req.body;

    console.log(`[Webhook] Processando lead: ${phone}`);

    // Upsert com mapeamento inteligente
    await db.insert(leads).values({
      name: name || "Lead N8N",
      phone,
      email,
      // Mapeia campos do N8N para colunas do banco
      qualification: qualification || "nao_qualificado",
      stage: stage || "novo",
      clientType: client_type || "comprador",
      budgetMin: budget_min ? String(budget_min) : null,
      budgetMax: budget_max ? String(budget_max) : null,
      preferredNeighborhoods: neighborhoods,
      interestProfile: interest_profile || {}, // Guarda o JSON completo por segurança
    }).onConflictDoUpdate({
      target: leads.phone,
      set: { 
        qualification: qualification, // Atualiza se a IA qualificou melhor
        stage: stage,
        updatedAt: new Date()
      }
    });

    if (message_log) {
      await db.insert(n8nChatHistories).values({
        sessionId: phone,
        message: typeof message_log === 'string' ? message_log : JSON.stringify(message_log),
        role: 'user'
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro no processamento do webhook" });
  }
});

export default router;
