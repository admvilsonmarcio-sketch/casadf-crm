import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { properties } from '../drizzle/schema.ts';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in your .env file.");
}

// Cria Pool de Conexão PostgreSQL (usando o padrão definido em server/db.ts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Inicializa Drizzle com o pool
const db = drizzle(pool, { schema: { properties } });

// Dados de Exemplo (propriedades.totalArea e .price serão convertidos para string, que é o tipo 'numeric' do PostgreSQL, evitando erros de serialização)
const sampleProperties = [
  // ... (dados de exemplo omitidos para brevidade)
  {
    title: "Mansão de Luxo no Lago Sul",
    description: "Magnífica mansão com vista panorâmica para o Lago Paranoá. Projeto arquitetônico exclusivo com acabamentos de primeira linha, piscina infinity, sauna, home theater e amplo jardim paisagístico. Perfeita para quem busca privacidade e sofisticação.",
    propertyType: "casa",
    transactionType: "venda",
    salePrice: 850000000, // R$ 8.500.000 em centavos
    bedrooms: 6,
    bathrooms: 8,
    parkingSpaces: 6,
    totalArea: 1200,
    address: "SHIS QL 10 Conjunto 5",
    neighborhood: "Lago Sul",
    city: "Brasília",
    state: "DF",
    zipCode: "71630-055",
    status: "disponivel",
    featured: true,
    referenceCode: "LS-001",
    mainImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop"
    ])
  },
  // ... (outras 8 propriedades de exemplo)
];

console.log('🏠 Inserindo imóveis de exemplo (PostgreSQL)...');

for (const property of sampleProperties) {
  // Conversão explícita para string para campos numeric do PostgreSQL
  const salePriceString = property.salePrice ? String(property.salePrice) : null;
  const rentPriceString = property.rentPrice ? String(property.rentPrice) : null;
  
  await db.insert(properties).values({
    ...property,
    price: salePriceString || rentPriceString || '0', // 'price' original não está em uso, mas mantido a compatibilidade
    salePrice: salePriceString,
    rentPrice: rentPriceString,
    totalArea: property.totalArea ? String(property.totalArea) : null,
  }).onConflictDoNothing(); // Garante que não duplique
  console.log(`✅ ${property.title}`);
}

console.log(`\n✨ ${sampleProperties.length} imóveis inseridos com sucesso!`);

// Fechar pool de conexão
await pool.end();
