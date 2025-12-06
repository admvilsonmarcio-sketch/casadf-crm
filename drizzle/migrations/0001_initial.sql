-- Migration: Initial schema for CasaDF CRM
-- Este arquivo contém a criação das tabelas principais do sistema
-- utilizando PostgreSQL. Execute-o antes de rodar a aplicação
-- em produção.

-- Enums
CREATE TYPE contract_status AS ENUM ('ativo','encerrado','pendente');
CREATE TYPE user_role AS ENUM ('admin','corretor','cliente','guest');

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role user_role DEFAULT 'cliente',
  avatar TEXT,
  phone TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Proprietários de imóveis
CREATE TABLE IF NOT EXISTS owners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf_cnpj TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Imóveis
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state VARCHAR(2),
  zip_code VARCHAR(20),
  price NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2),
  rent_price NUMERIC(12,2),
  type VARCHAR(50) NOT NULL,
  transaction_type VARCHAR(50) DEFAULT 'venda',
  status VARCHAR(50) DEFAULT 'disponivel',
  features JSONB,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  total_area NUMERIC,
  main_image TEXT,
  images JSONB,
  featured BOOLEAN DEFAULT FALSE,
  reference_code TEXT,
  owner_id INTEGER REFERENCES owners(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Imagens de propriedades
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_key TEXT,
  caption TEXT,
  is_primary INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categorias de blog
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Postagens do blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category_id INTEGER REFERENCES blog_categories(id),
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Avaliações
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  title TEXT,
  client_name TEXT NOT NULL,
  client_role TEXT,
  client_photo TEXT,
  rating INTEGER DEFAULT 5,
  content TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads e CRM
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  source TEXT,
  client_type VARCHAR(50),
  qualification VARCHAR(50) DEFAULT 'nao_qualificado',
  stage VARCHAR(50) DEFAULT 'novo',
  urgency_level VARCHAR(50),
  buyer_profile VARCHAR(50),
  transaction_interest VARCHAR(50),
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_neighborhoods TEXT,
  preferred_property_types TEXT,
  notes TEXT,
  tags TEXT,
  interested_property_id INTEGER,
  interest_profile JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Status de atendimento N8N
CREATE TABLE IF NOT EXISTS n8n_status_atendimento (
  session_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  ultimo_contexto JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fontes de campanha
CREATE TABLE IF NOT EXISTS campaign_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT,
  budget NUMERIC,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Movimentações financeiras
CREATE TABLE IF NOT EXISTS financial_movements (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Taxas de bancos
CREATE TABLE IF NOT EXISTS bank_rates (
  id SERIAL PRIMARY KEY,
  bank_name TEXT NOT NULL,
  annual_interest_rate NUMERIC(5,2) NOT NULL,
  max_years INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fila de mensagens N8N
CREATE TABLE IF NOT EXISTS n8n_fila_mensagens (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  mensagem TEXT,
  id_mensagem TEXT UNIQUE,
  processado BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Históricos de chat N8N
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  message JSONB NOT NULL,
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices adicionais e constraints
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);