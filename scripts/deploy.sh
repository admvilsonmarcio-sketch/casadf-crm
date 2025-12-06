#!/bin/bash

# ================================================================
# Script de Deploy para CasaDF CRM
#
# Este script facilita a configuração e publicação da aplicação
# utilizando Docker Compose. Ele verifica se o arquivo `.env` está
# presente, constrói as imagens, sobe os containers, e exibe o
# status e logs iniciais. Use este script na sua VPS para
# automatizar o processo de deploy.
#
# Uso:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
# ================================================================

set -e

echo "🚀 Iniciando deploy do CasaDF CRM..."

# 1. Verificar se .env existe
if [ ! -f .env ]; then
  echo "❌ ERRO: Arquivo .env não encontrado."
  echo "👉 Copie .env.example para .env e ajuste as variáveis antes de prosseguir."
  exit 1
fi

# 2. Parar containers antigos (se existirem)
echo "🛑 Parando containers antigos..."
docker compose down || true

# 3. Construir e iniciar containers
echo "🏗️  Construindo imagens e iniciando serviços..."
docker compose up -d --build

# 4. Aguardar inicialização
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# 5. Mostrar status
echo "📊 Status dos containers:"
docker compose ps

# 6. Verificar último log do app
echo "📋 Últimas linhas de log do app:"
docker compose logs --tail=20 app || true

# 7. Testar endpoint de saúde
echo "🏥 Verificando endpoint de health..."
if curl -sSf http://localhost:5000/health > /dev/null; then
  echo "✅ API respondendo corretamente."
else
  echo "❌ API não respondeu conforme esperado. Verifique os logs."
  exit 1
fi

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Acesse a aplicação em http://<seu-domínio-ou-ip>:5000"