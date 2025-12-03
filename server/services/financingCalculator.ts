import { db } from "../db"; 
import { bankRates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SimulationInput {
  propertyValue: number;
  downPayment: number;
  years: number;
  bankId?: number; // Opcional, se não vier pega a média
}

export const simulate = async (input: SimulationInput) => {
  // Busca taxa real no banco ou usa default SELIC based
  let rate = 11.25; // Default safe
  
  if (input.bankId) {
    const bank = await db.query.bankRates.findFirst({
      where: eq(bankRates.id, input.bankId)
    });
    if (bank) rate = Number(bank.interestRate);
  }

  const loanAmount = input.propertyValue - input.downPayment;
  const months = input.years * 12;
  const monthlyRate = (rate / 100) / 12;

  // Cálculo SAC (Primeira parcela)
  const amortizacao = loanAmount / months;
  const jurosSAC = loanAmount * monthlyRate;
  const firstInstallmentSAC = amortizacao + jurosSAC;

  // Cálculo PRICE (Parcela Fixa)
  const factor = Math.pow(1 + monthlyRate, months);
  const installmentPrice = loanAmount * (monthlyRate * factor) / (factor - 1);

  return {
    system: {
      sac: {
        firstInstallment: firstInstallmentSAC,
        lastInstallment: amortizacao + (amortizacao * monthlyRate), // Simplificado
        totalInterest: (jurosSAC * months) / 2 // Aproximação linear
      },
      price: {
        installment: installmentPrice,
        totalPaid: installmentPrice * months
      }
    },
    meta: {
      appliedRate: rate,
      bank: input.bankId ? "Taxa Específica" : "Taxa de Mercado"
    }
  };
};
