import { Router } from "express";
import { db } from "../../db";
import { leads, n8nChatHistories, n8nFilaMensagens } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ROTA: POST /api/webhooks/leads/ingest
router.post("/leads/ingest", async (req, res) => {
  try {
    const { name, phone, email, interest_profile, message_content, message_id } = req.body;

    if (!phone) return res.status(400).json({ error: "Phone is required" });

    // 1. UPSERT LEAD
    const existingLead = await db.query.leads.findFirst({
      where: eq(leads.phone, phone)
    });

    let leadId;

    if (existingLead) {
      // Atualiza perfil de interesse se fornecido
      if (interest_profile) {
        await db.update(leads)
          .set({ interestProfile: interest_profile, updatedAt: new Date() })
          .where(eq(leads.id, existingLead.id));
      }
      leadId = existingLead.id;
    } else {
      // Cria novo lead
      const [newLead] = await db.insert(leads).values({
        name: name || "Lead N8N",
        phone,
        email,
        interestProfile: interest_profile || {},
        pipelineStage: "novo"
      }).returning({ id: leads.id });
      leadId = newLead.id;
    }

    // 2. LOG HISTORY (Memória de Conversa)
    if (message_content) {
      await db.insert(n8nChatHistories).values({
        sessionId: phone,
        message: { role: "user", content: message_content, source: "webhook" }
      });
    }

    // 3. Opcional: Colocar na fila para processamento assíncrono se necessário
    if (message_id) {
       await db.insert(n8nFilaMensagens).values({
         sessionId: phone,
         mensagem: message_content,
         idMensagem: message_id,
         processado: true // Já ingerido
       });
    }

    return res.json({ success: true, leadId, action: existingLead ? "updated" : "created" });

  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
