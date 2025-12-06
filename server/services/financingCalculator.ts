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

// Helper para formatar o valor (arredonda para o inteiro mais próximo em centavos)
const formatToCents = (value: number) => Math.round(value);

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

    // 1. Conversão da Taxa Anual Efetiva (string do DB) para Fator Mensal (float)
    const annualRatePercent = parseFloat(bank.annualInterestRate);
    if (isNaN(annualRatePercent)) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Taxa ${bank.annualInterestRate} do banco ${bank.bankName} é inválida.` });
    }

    const annualEffectiveRate = annualRatePercent / 100; // Ex: 12.50% -> 0.125
    
    // Taxa Mensal Efetiva (MER)
    // i_mensal = (1 + i_anual)^(1/12) - 1
    const monthlyRateFactor = Math.pow(1 + annualEffectiveRate, 1 / 12) - 1;
    const i = monthlyRateFactor;

    // --- 2. CÁLCULO PRICE (Tabela Price) ---
    // Parcela fixa: PMT = [Valor_Financiado * i] / [1 - (1 + i)^-meses]
    const priceInstallment = loanAmount * (i / (1 - Math.pow(1 + i, -months)));
    const priceTotalPaid = priceInstallment * months;

    // --- 3. CÁLCULO SAC (Sistema de Amortização Constante) ---
    const amortization = loanAmount / months;
    
    // 1ª Parcela: Amortização + Juros sobre o Saldo Devedor (Valor Financiado)
    const sacInterest1 = loanAmount * i;
    const sacFirstInstallment = amortization + sacInterest1;

    // Última Parcela: Amortização + Juros sobre o Saldo Devedor (Amortização * i)
    const sacInterestLast = amortization * i;
    const sacLastInstallment = amortization + sacInterestLast;

    // Total Pago: (1ª Parcela + Última Parcela) / 2 * Meses (decréscimo linear)
    const sacTotalPaid = (sacFirstInstallment + sacLastInstallment) / 2 * months; 

    return {
        system: {
            price: {
                installment: formatToCents(priceInstallment),
                totalPaid: formatToCents(priceTotalPaid),
            },
            sac: {
                firstInstallment: formatToCents(sacFirstInstallment),
                lastInstallment: formatToCents(sacLastInstallment),
                totalPaid: formatToCents(sacTotalPaid),
            }
        }
    };
}
