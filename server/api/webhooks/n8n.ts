import { Router } from "express";
import { db } from "../../db";
import { leads, n8nChatHistories } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/webhooks/leads/ingest
router.post("/leads/ingest", async (req, res) => {
  try {
    const { 
      name, phone, email, 
      qualification, stage, client_type, // Dados de CRM
      budget_min, budget_max, neighborhoods, // Dados Financeiros
      property_id, // ID do imóvel de interesse
      message_log, interest_profile 
    } = req.body;

    console.log(`[Webhook] Processando lead: ${phone} | Qualificação: ${qualification}`);

    // Upsert Inteligente: Atualiza colunas se existirem no payload
    await db.insert(leads).values({
      name: name || "Lead N8N",
      phone: phone,
      email: email,
      // Mapeamento N8N -> Colunas Reais
      qualification: qualification || "nao_qualificado",
      stage: stage || "novo",
      clientType: client_type || "comprador",
      budgetMin: budget_min ? String(budget_min) : null,
      budgetMax: budget_max ? String(budget_max) : null,
      preferredNeighborhoods: neighborhoods,
      interestedPropertyId: property_id ? Number(property_id) : null,
      interestProfile: interest_profile || {}, // Guarda o JSON bruto por segurança
    }).onConflictDoUpdate({
      target: leads.phone,
      set: { 
        // Só atualiza se a IA mandou dado novo, senão mantém o que o corretor editou
        ...(qualification ? { qualification } : {}),
        ...(stage ? { stage } : {}),
        ...(budget_min ? { budgetMin: String(budget_min) } : {}),
        ...(neighborhoods ? { preferredNeighborhoods: neighborhoods } : {}),
        interestProfile: interest_profile
      }
    });

    // Log de Conversa
    if (message_log) {
      await db.insert(n8nChatHistories).values({
        sessionId: phone,
        role: 'user',
        message: typeof message_log === 'string' ? { content: message_log } : message_log
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
});

export default router;
