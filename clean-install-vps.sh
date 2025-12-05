#!/bin/bash

# ============================================
# LIMPEZA COMPLETA E REINSTALAÇÃO - CasaDF CRM
# VPS DigitalOcean - Ubuntu 25.10
# ============================================

set -e  # Parar em caso de erro

echo "🚨 ============================================"
echo "🚨 ATENÇÃO: Este script vai APAGAR TUDO!"
echo "🚨 - Todos os containers Docker"
echo "🚨 - Todas as imagens Docker"
echo "🚨 - Todos os volumes (DADOS DO BANCO!)"
echo "🚨 - Diretórios: casadf-crm, sistema-corretor"
echo "🚨 ============================================"
echo ""
read -p "⚠️  Tem certeza que deseja continuar? Digite 'SIM' para confirmar: " confirm

if [ "$confirm" != "SIM" ]; then
    echo "❌ Operação cancelada."
    exit 1
fi

echo ""
echo "🧹 ============================================"
echo "🧹 INICIANDO LIMPEZA COMPLETA..."
echo "🧹 ============================================"
echo ""

# ============================================
# PASSO 1: PARAR E REMOVER DOCKER
# ============================================
echo "🛑 [1/5] Parando todos os containers Docker..."
docker stop $(docker ps -aq) 2>/dev/null || echo "  ℹ️  Nenhum container rodando"

echo "🗑️  Removendo todos os containers..."
docker rm $(docker ps -aq) 2>/dev/null || echo "  ℹ️  Nenhum container para remover"

echo "🗑️  Removendo todas as imagens..."
docker rmi $(docker images -q) -f 2>/dev/null || echo "  ℹ️  Nenhuma imagem para remover"

echo "🗑️  Removendo todos os volumes (DADOS SERÃO PERDIDOS!)..."
docker volume rm $(docker volume ls -q) 2>/dev/null || echo "  ℹ️  Nenhum volume para remover"

echo "🗑️  Removendo todas as redes customizadas..."
docker network prune -f 2>/dev/null || echo "  ℹ️  Nenhuma rede para remover"

echo "🧹 Limpando sistema Docker..."
docker system prune -af --volumes 2>/dev/null || echo "  ℹ️  Sistema Docker limpo"

echo "✅ Docker limpo!"
echo ""

# ============================================
# PASSO 2: REMOVER DIRETÓRIOS ANTIGOS
# ============================================
echo "🗑️  [2/5] Removendo diretórios antigos..."

if [ -d "/root/casadf-crm" ]; then
    echo "  🗑️  Removendo /root/casadf-crm..."
    rm -rf /root/casadf-crm
    echo "  ✅ Removido"
fi

if [ -d "/root/sistema-corretor" ]; then
    echo "  🗑️  Removendo /root/sistema-corretor..."
    rm -rf /root/sistema-corretor
    echo "  ✅ Removido"
fi

echo "✅ Diretórios antigos removidos!"
echo ""

# ============================================
# PASSO 3: CLONAR REPOSITÓRIO ATUALIZADO
# ============================================
echo "📥 [3/5] Clonando repositório atualizado do GitHub..."
cd /root
git clone https://github.com/admvilsonmarcio-sketch/casadf-crm.git
cd casadf-crm
echo "✅ Repositório clonado!"
echo ""

# ============================================
# PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ============================================
echo "⚙️  [4/5] Configurando variáveis de ambiente..."

if [ ! -f .env ]; then
    echo "  📝 Criando arquivo .env..."
    cp .env.production .env
    
    # Gerar JWT_SECRET automaticamente
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Gerar senha forte para o banco
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
    
    # Substituir valores no .env
    sed -i "s/CHANGE_ME_STRONG_PASSWORD/${DB_PASSWORD}/g" .env
    sed -i "s/CHANGE_ME_USE_OPENSSL_RAND_BASE64_32/${JWT_SECRET}/g" .env
    
    echo "  ✅ Arquivo .env criado com valores gerados automaticamente"
    echo ""
    echo "  📋 Credenciais geradas:"
    echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  DB_PASSWORD: ${DB_PASSWORD}"
    echo "  JWT_SECRET: ${JWT_SECRET}"
    echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ⚠️  SALVE ESSAS CREDENCIAIS EM LOCAL SEGURO!"
    echo ""
    
    # Salvar credenciais em arquivo
    cat > /root/casadf-crm-credentials.txt << EOF
# ============================================
# CREDENCIAIS DO CASADF CRM
# Geradas em: $(date)
# ============================================

DB_USER=casadf_admin
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=casadf_crm_prod
JWT_SECRET=${JWT_SECRET}

# ============================================
# IMPORTANTE: Mantenha este arquivo seguro!
# ============================================
EOF
    
    chmod 600 /root/casadf-crm-credentials.txt
    echo "  💾 Credenciais salvas em: /root/casadf-crm-credentials.txt"
else
    echo "  ℹ️  Arquivo .env já existe, mantendo configuração atual"
fi

echo "✅ Variáveis de ambiente configuradas!"
echo ""

# ============================================
# PASSO 5: FAZER DEPLOY
# ============================================
echo "🚀 [5/5] Iniciando deploy do sistema..."
echo ""

echo "  🏗️  Construindo e iniciando containers..."
docker compose up -d --build

echo ""
echo "  ⏳ Aguardando containers iniciarem (30 segundos)..."
sleep 30

echo ""
echo "  📊 Status dos containers:"
docker compose ps

echo ""
echo "  📋 Últimos logs da aplicação:"
docker compose logs --tail=30 app

echo ""
echo "  🏥 Testando health check..."
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "  ✅ Sistema funcionando!"
else
    echo "  ⚠️  Sistema ainda não está respondendo (pode demorar mais alguns segundos)"
    echo "  📋 Verifique os logs com: docker compose logs -f app"
fi

echo ""
echo "🎉 ============================================"
echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "🎉 ============================================"
echo ""
echo "📍 Informações do Sistema:"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 URL Local: http://localhost:5000"
echo "  🌐 URL Pública: http://157.230.95.133:5000"
echo "  📁 Diretório: /root/casadf-crm"
echo "  🔑 Credenciais: /root/casadf-crm-credentials.txt"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Comandos Úteis:"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ver logs:      docker compose logs -f app"
echo "  Reiniciar:     docker compose restart"
echo "  Parar:         docker compose down"
echo "  Status:        docker compose ps"
echo "  Backup DB:     docker compose exec db pg_dump -U casadf_admin casadf_crm_prod > backup.sql"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Sistema pronto para uso!"
