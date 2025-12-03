import { db } from "../db";
import { bankRates } from "../../drizzle/schema";

const BANKS = ["Caixa", "Itaú", "Bradesco", "Santander", "Inter"];

export const updateRatesMock = async () => {
  console.log("🔄 [Crawler] Atualizando taxas de mercado...");
  
  // SELIC base + Spread bancário aleatório entre 1.5% e 3.5%
  const baseSelic = 11.25;
  
  for (const bank of BANKS) {
    const spread = 1.5 + Math.random() * 2;
    const rate = (baseSelic + spread).toFixed(2);
    
    // Upsert Simulado (Apaga e recria para este mock)
    // Em produção seria um upsert real pelo nome
    await db.insert(bankRates).values({
      bankName: bank,
      interestRate: rate,
      maxYears: 35,
      updatedAt: new Date()
    });
  }
  
  console.log("✅ [Crawler] Taxas atualizadas com sucesso.");
};
