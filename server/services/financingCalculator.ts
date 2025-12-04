import { db } from "../db";
import { bankRates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

interface SimulationInput {
    propertyValue: number; // Em centavos
    downPayment: number; // Em centavos
    years: number;
    bankId: number;
}

interface AmortizationResult {
    system: {
        sac: { firstInstallment: number; lastInstallment: number; totalPaid: number; };
        price: { installment: number; totalPaid: number; };
    }
}

const format = (value: number) => Math.round(value);

export async function simulate(input: SimulationInput): Promise<AmortizationResult> {
    const loanAmount = input.propertyValue - input.downPayment;
    const months = input.years * 12;

    if (loanAmount <= 0) {
        return {
            system: {
                sac: { firstInstallment: 0, lastInstallment: 0, totalPaid: 0 },
                price: { installment: 0, totalPaid: 0 }
            }
        };
    }

    const bank = await db.query.bankRates.findFirst({
        where: eq(bankRates.id, input.bankId)
    });

    if (!bank) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Taxa bancária para o ID ${input.bankId} não encontrada.` });
    }

    const annualRate = Number(bank.annualInterestRate) / 100; // Ex: 0.12 (12%)
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1; // Taxa mensal real
    const i = monthlyRate;

    // --- 1. CÁLCULO PRICE (Tabela Price) ---
    const priceInstallment = loanAmount * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
    const priceTotalPaid = priceInstallment * months;

    // --- 2. CÁLCULO SAQUE (Sistema de Amortização Constante) ---
    const amortization = loanAmount / months;
    
    const sacInterest1 = loanAmount * i;
    const sacFirstInstallment = amortization + sacInterest1;

    const sacInterestLast = amortization * i;
    const sacLastInstallment = amortization + sacInterestLast;

    const sacTotalPaid = (sacFirstInstallment + sacLastInstallment) / 2 * months; 

    return {
        system: {
            price: {
                installment: format(priceInstallment),
                totalPaid: format(priceTotalPaid),
            },
            sac: {
                firstInstallment: format(sacFirstInstallment),
                lastInstallment: format(sacLastInstallment),
                totalPaid: format(sacTotalPaid),
            }
        }
    };
}
