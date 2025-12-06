import { eq } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'node:crypto';
import { db, pool } from './db';
import {
  users,
  blogCategories,
  bankRates,
} from '../drizzle/schema';

/**
 * Script de seed para popular o banco de dados com dados
 * iniciais. Esse script cria um usuário administrador,
 * algumas categorias de blog e taxas bancárias padrão caso
 * ainda não existam.
 */
async function main() {
  // 1. Usuário administrador
  const adminEmail = 'admin@casadf.com.br';
  const existingAdmins = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail));
  if (existingAdmins.length === 0) {
    const password = 'admin123'; // senha padrão, altere no primeiro acesso
    // Gerar sal e hash com o mesmo algoritmo usado em auth.ts (scrypt)
    const salt = randomBytes(16).toString('hex');
    const hashBuffer = scryptSync(password, salt, 64);
    const passwordHash = hashBuffer.toString('hex');
    await db.insert(users).values({
      name: 'Administrador',
      email: adminEmail,
      passwordHash,
      salt,
      role: 'admin',
      phone: '0000000000',
    });
    console.log('✅ Usuário admin criado:', adminEmail);
  } else {
    console.log('ℹ️ Usuário admin já existe, pulando inserção');
  }

  // 2. Categorias de blog
  const defaultCategories = [
    { name: 'Mercado Imobiliário', slug: 'mercado-imobiliario' },
    { name: 'Financiamento', slug: 'financiamento' },
    { name: 'Dicas de Compra', slug: 'dicas-de-compra' },
  ];
  for (const cat of defaultCategories) {
    const exists = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.slug, cat.slug));
    if (exists.length === 0) {
      await db.insert(blogCategories).values({
        name: cat.name,
        slug: cat.slug,
      });
      console.log('✅ Categoria adicionada:', cat.name);
    }
  }

  // 3. Taxas de bancos para simulador de financiamento
  const defaultRates = [
    { bankName: 'Banco A', annualInterestRate: 8.5, maxYears: 35 },
    { bankName: 'Banco B', annualInterestRate: 9.0, maxYears: 30 },
    { bankName: 'Banco C', annualInterestRate: 7.8, maxYears: 25 },
  ];
  for (const rate of defaultRates) {
    const exists = await db
      .select()
      .from(bankRates)
      .where(eq(bankRates.bankName, rate.bankName));
    if (exists.length === 0) {
      await db.insert(bankRates).values({
        bankName: rate.bankName,
        annualInterestRate: rate.annualInterestRate,
        maxYears: rate.maxYears,
      });
      console.log('✅ Taxa bancária adicionada:', rate.bankName);
    }
  }

  // Fechar conexões do pool
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Erro ao executar seed:', err);
  process.exit(1);
});