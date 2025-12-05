# 🚀 Instalação Limpa na VPS - CasaDF CRM

**Data:** 05 de Dezembro de 2025  
**VPS:** DigitalOcean Droplet  
**IP:** 157.230.95.133  
**Sistema:** Ubuntu 25.10

---

## ⚠️ ATENÇÃO

Este script vai **APAGAR TUDO** na VPS:
- ❌ Todos os containers Docker
- ❌ Todas as imagens Docker
- ❌ Todos os volumes Docker (**DADOS DO BANCO SERÃO PERDIDOS!**)
- ❌ Diretórios: `/root/casadf-crm`, `/root/sistema-corretor`

**Use apenas se você tem certeza do que está fazendo!**

---

## 📋 PRÉ-REQUISITOS

- ✅ Acesso SSH à VPS como root
- ✅ Docker e Docker Compose instalados
- ✅ Git instalado
- ✅ Conexão com internet

---

## 🚀 INSTALAÇÃO (MÉTODO 1 - AUTOMÁTICO)

### Passo 1: Conectar na VPS

```bash
ssh root@157.230.95.133
```

### Passo 2: Baixar e Executar Script

```bash
# Baixar script diretamente do GitHub
curl -o clean-install-vps.sh https://raw.githubusercontent.com/admvilsonmarcio-sketch/casadf-crm/main/clean-install-vps.sh

# Dar permissão de execução
chmod +x clean-install-vps.sh

# Executar
./clean-install-vps.sh
```

### Passo 3: Confirmar

Quando solicitado, digite **`SIM`** para confirmar a limpeza.

### Passo 4: Aguardar

O script vai:
1. ✅ Parar e remover todo o Docker
2. ✅ Apagar diretórios antigos
3. ✅ Clonar repositório atualizado
4. ✅ Gerar credenciais automaticamente
5. ✅ Fazer deploy completo

**Tempo estimado:** 5-10 minutos

---

## 🚀 INSTALAÇÃO (MÉTODO 2 - MANUAL)

Se preferir fazer manualmente, siga os passos:

### 1. Limpar Docker

```bash
# Parar todos os containers
docker stop $(docker ps -aq)

# Remover containers
docker rm $(docker ps -aq)

# Remover imagens
docker rmi $(docker images -q) -f

# Remover volumes (CUIDADO!)
docker volume rm $(docker volume ls -q)

# Limpar sistema
docker system prune -af --volumes
```

### 2. Remover Diretórios

```bash
cd /root
rm -rf casadf-crm
rm -rf sistema-corretor
```

### 3. Clonar Repositório

```bash
git clone https://github.com/admvilsonmarcio-sketch/casadf-crm.git
cd casadf-crm
```

### 4. Configurar .env

```bash
# Copiar template
cp .env.production .env

# Gerar JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)

# Gerar senha do banco
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)

# Editar .env
nano .env
```

Substituir:
- `CHANGE_ME_STRONG_PASSWORD` → Senha gerada
- `CHANGE_ME_USE_OPENSSL_RAND_BASE64_32` → JWT_SECRET gerado

### 5. Fazer Deploy

```bash
docker compose up -d --build
```

### 6. Verificar

```bash
# Ver logs
docker compose logs -f app

# Testar
curl http://localhost:5000/health
```

---

## 📊 O QUE O SCRIPT FAZ

### Passo 1: Limpar Docker (30s)
```
🛑 Parando containers...
🗑️  Removendo containers...
🗑️  Removendo imagens...
🗑️  Removendo volumes...
🗑️  Removendo redes...
🧹 Limpando sistema...
```

### Passo 2: Remover Diretórios (5s)
```
🗑️  Removendo /root/casadf-crm...
🗑️  Removendo /root/sistema-corretor...
```

### Passo 3: Clonar Repositório (30s)
```
📥 Clonando do GitHub...
✅ Repositório clonado!
```

### Passo 4: Configurar .env (5s)
```
⚙️  Criando .env...
🔐 Gerando credenciais...
💾 Salvando em /root/casadf-crm-credentials.txt...
```

### Passo 5: Deploy (5-10min)
```
🚀 Construindo containers...
⏳ Aguardando inicialização...
📊 Verificando status...
🏥 Testando health check...
✅ Sistema funcionando!
```

---

## 🔑 CREDENCIAIS GERADAS

Após a instalação, as credenciais estarão em:

```bash
cat /root/casadf-crm-credentials.txt
```

**Exemplo:**
```
DB_USER=casadf_admin
DB_PASSWORD=xK9mP2nL5qR8wT4vY7zA
DB_NAME=casadf_crm_prod
JWT_SECRET=aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=
```

**⚠️ IMPORTANTE:** Salve essas credenciais em local seguro!

---

## 🌐 ACESSAR O SISTEMA

Após a instalação:

### Localmente (na VPS):
```bash
curl http://localhost:5000/health
```

### Externamente:
```
http://157.230.95.133:5000
```

**Nota:** Você precisa liberar a porta 5000 no firewall:
```bash
ufw allow 5000/tcp
ufw reload
```

---

## 🔧 COMANDOS ÚTEIS

### Ver Logs
```bash
cd /root/casadf-crm
docker compose logs -f app
```

### Reiniciar Sistema
```bash
docker compose restart
```

### Parar Sistema
```bash
docker compose down
```

### Ver Status
```bash
docker compose ps
```

### Backup do Banco
```bash
docker compose exec db pg_dump -U casadf_admin casadf_crm_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup
```bash
docker compose exec -T db psql -U casadf_admin casadf_crm_prod < backup.sql
```

### Ver Credenciais
```bash
cat /root/casadf-crm-credentials.txt
```

---

## 🐛 TROUBLESHOOTING

### Problema: Script falha ao remover Docker

**Solução:**
```bash
# Forçar remoção
docker rm -f $(docker ps -aq)
docker rmi -f $(docker images -q)
docker volume rm -f $(docker volume ls -q)
```

### Problema: Git clone falha

**Solução:**
```bash
# Verificar conexão
ping github.com

# Tentar novamente
rm -rf casadf-crm
git clone https://github.com/admvilsonmarcio-sketch/casadf-crm.git
```

### Problema: Build falha

**Solução:**
```bash
cd /root/casadf-crm
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Problema: Sistema não responde

**Solução:**
```bash
# Ver logs detalhados
docker compose logs --tail=100 app

# Verificar se banco está rodando
docker compose ps

# Reiniciar
docker compose restart
```

### Problema: Porta 5000 não acessível externamente

**Solução:**
```bash
# Liberar no firewall
ufw allow 5000/tcp
ufw reload

# Verificar se está escutando
netstat -tulpn | grep 5000
```

---

## 🔒 CONFIGURAR NGINX + SSL (OPCIONAL)

Para usar domínio e HTTPS:

### 1. Instalar Nginx
```bash
apt update
apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Nginx

Criar `/etc/nginx/sites-available/casadf-crm`:
```nginx
server {
    listen 80;
    server_name crm.casadf.com.br;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Ativar
```bash
ln -s /etc/nginx/sites-available/casadf-crm /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. Configurar SSL
```bash
certbot --nginx -d crm.casadf.com.br
```

---

## ✅ CHECKLIST PÓS-INSTALAÇÃO

- [ ] Sistema respondendo em http://localhost:5000/health
- [ ] Credenciais salvas em local seguro
- [ ] Backup inicial do banco feito
- [ ] Firewall configurado
- [ ] Nginx + SSL configurado (se aplicável)
- [ ] Domínio apontando para VPS (se aplicável)
- [ ] Monitoramento configurado
- [ ] Logs sendo verificados

---

## 📞 SUPORTE

- **GitHub Issues:** https://github.com/admvilsonmarcio-sketch/casadf-crm/issues
- **Email:** suporte@casadf.com.br

---

**Instalação limpa concluída! Sistema pronto para uso! 🎉**
