import { db } from "../db";
import { bankRates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SimulationResult {
  bankName: string;
  appliedRate: number;
  loanAmount: number;
  months: number;
  price: {
    firstInstallment: number;
    totalInterest: number;
    grandTotal: number;
  };
  sac: {
    firstInstallment: number;
    lastInstallment: number;
    totalInterest: number;
    grandTotal: number;
  };
  minIncomeRequired: number;
}

export const simulateFinancing = async (
  propertyValue: number,
  downPayment: number,
  years: number,
  bankId: number
): Promise<SimulationResult> => {
  // 1. Busca a taxa do banco no banco de dados (Postgres)
  const rateRecord = await db
    .select()
    .from(bankRates)
    .where(eq(bankRates.id, bankId))
    .limit(1);

  if (!rateRecord.length) {
    throw new Error("Banco não encontrado ou taxa não cadastrada.");
  }

  const bank = rateRecord[0];
  const annualRate = Number(bank.annualInterestRate);
  
  // 2. Variáveis base
  const loanAmount = propertyValue - downPayment;
  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100; // Taxa mensal decimal

  // 3. CÁLCULO PRICE (Parcela Fixa)
  const pricePmt = loanAmount * (
    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1)
  );
  
  const priceTotalPayment = pricePmt * months;
  const priceTotalInterest = priceTotalPayment - loanAmount;

  // 4. CÁLCULO SAC (Amortização Constante)
  const amortization = loanAmount / months;
  const sacFirstInterest = loanAmount * monthlyRate;
  const sacFirstPmt = amortization + sacFirstInterest;
  const sacLastPmt = amortization + (amortization * monthlyRate);
  
  const sacTotalPayment = (months / 2) * (sacFirstPmt + sacLastPmt);
  const sacTotalInterest = sacTotalPayment - loanAmount;

  // 5. Regra de Renda Mínima (30%)
  const minIncome = sacFirstPmt / 0.30;

  return {
    bankName: bank.bankName,
    appliedRate: annualRate,
    loanAmount,
    months,
    price: {
      firstInstallment: Number(pricePmt.toFixed(2)),
      totalInterest: Number(priceTotalInterest.toFixed(2)),
      grandTotal: Number(priceTotalPayment.toFixed(2))
    },
    sac: {
      firstInstallment: Number(sacFirstPmt.toFixed(2)),
      lastInstallment: Number(sacLastPmt.toFixed(2)),
      totalInterest: Number(sacTotalInterest.toFixed(2)),
      grandTotal: Number(sacTotalPayment.toFixed(2))
    },
    minIncomeRequired: Number(minIncome.toFixed(2))
  };
};
