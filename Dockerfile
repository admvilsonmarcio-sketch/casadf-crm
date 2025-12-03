FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Build
RUN npm run build

# Expor porta
EXPOSE 5000

# Comando de inicialização
CMD ["npm", "start"]
