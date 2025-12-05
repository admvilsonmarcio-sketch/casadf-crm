#!/bin/bash

# ============================================
# Script de Deploy para VPS - CasaDF CRM
# ============================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do CasaDF CRM..."

# 1. Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ ERRO: Arquivo .env não encontrado!"
    echo "📝 Copie .env.production para .env e preencha os valores:"
    echo "   cp .env.production .env"
    echo "   nano .env"
    exit 1
fi

# 2. Verificar variáveis obrigatórias
echo "🔍 Verificando variáveis de ambiente..."
required_vars=("DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env || grep -q "^${var}=CHANGE_ME" .env; then
        echo "❌ ERRO: Variável ${var} não configurada no .env"
        exit 1
    fi
done
echo "✅ Variáveis de ambiente OK"

# 3. Parar containers antigos
echo "🛑 Parando containers antigos..."
docker compose down || true

# 4. Limpar volumes (CUIDADO: apaga dados do banco!)
read -p "⚠️  Deseja limpar volumes do banco de dados? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️  Removendo volumes..."
    docker compose down -v
fi

# 5. Build e iniciar
echo "🏗️  Construindo e iniciando containers..."
docker compose up -d --build

# 6. Aguardar containers
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# 7. Verificar status
echo "📊 Status dos containers:"
docker compose ps

# 8. Verificar logs
echo ""
echo "📋 Últimos logs:"
docker compose logs --tail=20 app

# 9. Testar health
echo ""
echo "🏥 Testando health check..."
sleep 5
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Sistema funcionando!"
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo ""
    echo "📍 Acesse: http://localhost:5000"
else
    echo "❌ Sistema não está respondendo"
    echo "📋 Verifique os logs com: docker compose logs -f app"
    exit 1
fi
