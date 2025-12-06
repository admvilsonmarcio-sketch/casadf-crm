import fs from 'fs';
import path from 'path';
import { pool } from './db';

/**
 * Executa todos os arquivos de migração `.sql` presentes
 * na pasta `drizzle/migrations`. Isso permite rodar migrações
 * manuais sem depender do drizzle-kit. Os arquivos são
 * executados em ordem alfabética para garantir previsibilidade.
 */
async function runSqlMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'drizzle', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`▶️ Executando migração: ${file}`);
    await pool.query(sql);
  }
}

async function main() {
  try {
    console.log('⏳ Executando migrações SQL...');
    await runSqlMigrations();
    console.log('✅ Migrações concluídas!');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Falha ao executar migrações:', err);
  process.exit(1);
});
