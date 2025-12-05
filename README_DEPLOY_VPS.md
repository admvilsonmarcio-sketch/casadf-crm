# 🚀 Guia de Deploy no VPS - CasaDF CRM

**Última atualização:** 03 de Dezembro de 2025  
**Versão:** 2.0

---

## 📋 PRÉ-REQUISITOS

Antes de fazer o deploy, certifique-se de ter:

- ✅ VPS com Ubuntu 20.04+ ou Debian 11+
- ✅ Docker instalado
- ✅ Docker Compose instalado
- ✅ Acesso SSH ao servidor
- ✅ Domínio configurado (opcional)

---

## 🎯 DEPLOY RÁPIDO (5 MINUTOS)

### 1. Clonar o Repositório

```bash
cd ~
git clone https://github.com/admvilsonmarcio-sketch/casadf-crm.git
cd casadf-crm
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.production .env

# Editar com valores reais
nano .env
```

**Valores obrigatórios para alterar:**

```env
DB_USER=casadf_admin
DB_PASSWORD=SuaSenhaForte123!@#       # ← ALTERAR
DB_NAME=casadf_crm_prod
JWT_SECRET=sua_chave_secreta_aqui     # ← ALTERAR (gere com: openssl rand -base64 32)
ALLOWED_ORIGINS=https://seu-dominio.com.br  # ← ALTERAR
```

**Gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Executar Deploy

```bash
./deploy-vps.sh
```

O script vai:
1. ✅ Verificar se `.env` existe
2. ✅ Validar variáveis obrigatórias
3. ✅ Parar containers antigos
4. ✅ Construir e iniciar sistema
5. ✅ Testar health check

---

## 🔧 COMANDOS ÚTEIS

### Gerenciar Sistema

```bash
# Ver logs em tempo real
docker compose logs -f app

# Ver logs do banco
docker compose logs -f db

# Reiniciar sistema
docker compose restart

# Parar sistema
docker compose down

# Iniciar sistema
docker compose up -d

# Ver status
docker compose ps
```

### Atualizar Sistema

```bash
# 1. Fazer backup do banco (IMPORTANTE!)
docker compose exec db pg_dump -U casadf_admin casadf_crm_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Atualizar código
git pull origin main

# 3. Rebuild e reiniciar
docker compose down
docker compose up -d --build

# 4. Ver logs
docker compose logs -f app
```

### Backup e Restore

```bash
# Fazer backup
docker compose exec db pg_dump -U casadf_admin casadf_crm_prod > backup.sql

# Restaurar backup
docker compose exec -T db psql -U casadf_admin casadf_crm_prod < backup.sql
```

---

## 🐛 TROUBLESHOOTING

### ❌ Erro: "Could not resolve entry module index.html"

**Causa:** Vite não encontra o index.html

**Solução:** Já corrigido no commit mais recente. Faça `git pull`.

### ❌ Erro: "The DB_USER variable is not set"

**Causa:** Arquivo `.env` não existe ou está vazio

**Solução:**
```bash
cp .env.production .env
nano .env  # Preencher valores
```

### ❌ Erro: "Build failed"

**Causa:** Dependências desatualizadas ou erro no código

**Solução:**
```bash
# Limpar tudo e reconstruir
docker compose down -v
docker compose up -d --build --force-recreate
```

### ❌ Erro: "Connection refused" ao acessar

**Causa:** Firewall bloqueando porta 5000

**Solução:**
```bash
# Permitir porta 5000
sudo ufw allow 5000/tcp
sudo ufw reload
```

### ❌ Container reiniciando constantemente

**Causa:** Erro na aplicação ou banco não conecta

**Solução:**
```bash
# Ver logs detalhados
docker compose logs --tail=100 app

# Verificar se o banco está rodando
docker compose ps db

# Testar conexão com banco
docker compose exec app ping db
```

---

## 🌐 CONFIGURAR NGINX + SSL

### 1. Instalar Nginx e Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Nginx

Criar arquivo `/etc/nginx/sites-available/casadf-crm`:

```nginx
server {
    listen 80;
    server_name crm.casadf.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.casadf.com.br;

    # Certificados SSL (serão gerados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/crm.casadf.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.casadf.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy para aplicação
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

    # Logs
    access_log /var/log/nginx/casadf-crm-access.log;
    error_log /var/log/nginx/casadf-crm-error.log;
}
```

### 3. Ativar Configuração

```bash
sudo ln -s /etc/nginx/sites-available/casadf-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Configurar SSL

```bash
sudo certbot --nginx -d crm.casadf.com.br
```

Siga as instruções do Certbot.

### 5. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Certbot já configura renovação automática via cron
```

---

## 🔒 SEGURANÇA

### Checklist de Segurança

- [ ] Senha forte no banco de dados
- [ ] JWT_SECRET gerado com `openssl rand -base64 32`
- [ ] CORS configurado com domínios específicos
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado (apenas portas 80, 443, 22)
- [ ] Backup automático configurado
- [ ] Logs sendo monitorados

### Configurar Firewall (UFW)

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Bloquear porta 5000 externamente (apenas Nginx acessa)
# (não precisa permitir, pois Nginx acessa via localhost)

# Ativar firewall
sudo ufw enable
sudo ufw status
```

---

## 📊 MONITORAMENTO

### Ver Uso de Recursos

```bash
# CPU e memória dos containers
docker stats

# Espaço em disco
df -h

# Logs recentes
docker compose logs --tail=100 --timestamps
```

### Configurar Monitoramento Automático

Recomendamos:
- **Uptime Robot** - Monitoramento de uptime gratuito
- **Sentry** - Monitoramento de erros
- **Grafana + Prometheus** - Métricas avançadas

---

## 🆘 SUPORTE

### Logs Importantes

```bash
# Logs da aplicação
docker compose logs -f app

# Logs do banco
docker compose logs -f db

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do sistema
sudo journalctl -u docker -f
```

### Contato

- **Issues:** https://github.com/admvilsonmarcio-sketch/casadf-crm/issues
- **Email:** suporte@casadf.com.br

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy concluído:

- [ ] `.env` configurado com valores reais
- [ ] Sistema rodando: `docker compose ps`
- [ ] API respondendo: `curl http://localhost:5000/health`
- [ ] Banco de dados conectado
- [ ] Nginx configurado (se aplicável)
- [ ] SSL configurado (se aplicável)
- [ ] Domínio apontando para o servidor
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] Logs sendo verificados
- [ ] Firewall configurado

---

**Deploy realizado com sucesso! 🎉**

Para atualizações futuras, basta fazer `git pull` e `docker compose up -d --build`.
