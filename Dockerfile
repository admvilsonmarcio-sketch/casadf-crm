# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar todas as dependências (produção + desenvolvimento)
# O Vite e o TSX estão em devDependencies e são necessários para o build.
RUN npm ci --ignore-scripts

# Corrigir incompatibilidades de esbuild. O esbuild instala um binário
# específico para a plataforma e, ocasionalmente, sua versão de runtime
# diverge da versão do pacote. O comando abaixo recompila o binário
# alinhando as versões e evitando erros como "Host version does not match binary version".
RUN npm rebuild esbuild

# Copiar código fonte
COPY . .

# Build do frontend com Vite
RUN npm run build

# ============================================
# STAGE 2: Production
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copiar apenas o necessário do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared

# Expor porta
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["npm", "start"]
