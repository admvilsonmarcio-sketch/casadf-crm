import { Router } from "express";
import { db } from "../../db";
import { leads, n8nChatHistories } from "../../../drizzle/schema";

const router = Router();

// POST /api/webhooks/leads/ingest
router.post("/leads/ingest", async (req, res) => {
  try {
    const { name, phone, email, interest_profile, message_log } = req.body;
    console.log(`[Webhook] Lead recebido: ${phone}`);

    // Upsert Lead
    await db.insert(leads).values({
      name, phone, email, interestProfile: interest_profile
    }).onConflictDoUpdate({
      target: leads.phone, set: { interestProfile: interest_profile, email }
    });

    // Log Histórico
    if (message_log) {
      await db.insert(n8nChatHistories).values({
        sessionId: phone, message: message_log
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
