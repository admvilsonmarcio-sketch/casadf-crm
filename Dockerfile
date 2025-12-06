# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar TODAS as dependências (necessário para o 'build' que usa devDependencies como vite)
RUN npm ci --ignore-scripts

# Copiar código fonte
COPY . .

# Build do frontend com Vite
RUN npm run build

# ============================================
# STAGE 2: Production
# ============================================
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências de produção para a imagem final
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copiar artefatos do build
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
