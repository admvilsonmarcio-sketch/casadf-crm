# 🚀 Guia Prático de Deploy - CasaDF CRM

**Última atualização:** 03 de Dezembro de 2025  
**Status:** ✅ Sistema pronto para deploy

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar o deploy, certifique-se de ter:

- ✅ Servidor Linux (Ubuntu 20.04+ recomendado)
- ✅ Docker e Docker Compose instalados
- ✅ Domínio configurado (opcional, mas recomendado)
- ✅ Acesso SSH ao servidor

---

## 🎯 DEPLOY RÁPIDO (5 MINUTOS)

### Passo 1: Clonar o Repositório

```bash
cd /home/seu_usuario
git clone https://github.com/admvilsonmarcio-sketch/casadf-crm.git
cd casadf-crm
```

### Passo 2: Criar Arquivo `.env`

```bash
cp .env.example .env
nano .env
```

**Configuração mínima necessária:**

```env
# Banco de Dados
DB_USER=casadf_admin
DB_PASSWORD=SuaSenhaForte123!@#
DB_NAME=casadf_crm_prod
DATABASE_URL=postgresql://casadf_admin:SuaSenhaForte123!@#@db:5432/casadf_crm_prod

# Aplicação
PORT=5000
NODE_ENV=production

# Segurança (gere com: openssl rand -base64 32)
JWT_SECRET=sua_chave_secreta_gerada

# CORS
ALLOWED_ORIGINS=http://localhost:5000,https://seu-dominio.com.br
```

**Gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Passo 3: Subir o Sistema

```bash
docker compose up -d --build
```

### Passo 4: Verificar Status

```bash
# Ver logs
docker compose logs -f app

# Verificar containers
docker compose ps

# Testar API
curl http://localhost:5000/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T21:00:00.000Z",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@casadf.com",
    "role": "admin"
  }
}
```

---

## 🌐 CONFIGURAR DOMÍNIO E SSL

### Instalar Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configurar Nginx

Criar arquivo `/etc/nginx/sites-available/casadf-crm`:

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

### Ativar Configuração

```bash
sudo ln -s /etc/nginx/sites-available/casadf-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configurar SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d crm.casadf.com.br
```

Siga as instruções do Certbot. Ele configurará automaticamente o SSL.

---

## 🔄 ATUALIZAR O SISTEMA

### Atualizar Código

```bash
cd /home/seu_usuario/casadf-crm
git pull origin main
docker compose down
docker compose up -d --build
```

### Ver Logs

```bash
docker compose logs -f app
```

---

## 🛠️ COMANDOS ÚTEIS

### Gerenciar Containers

```bash
# Parar sistema
docker compose down

# Iniciar sistema
docker compose up -d

# Reiniciar sistema
docker compose restart

# Ver logs
docker compose logs -f

# Ver logs apenas do app
docker compose logs -f app

# Ver logs apenas do banco
docker compose logs -f db
```

### Acessar Container

```bash
# Acessar container da aplicação
docker compose exec app sh

# Acessar container do banco
docker compose exec db psql -U casadf_admin -d casadf_crm_prod
```

### Backup do Banco de Dados

```bash
# Fazer backup
docker compose exec db pg_dump -U casadf_admin casadf_crm_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker compose exec -T db psql -U casadf_admin casadf_crm_prod < backup_20251203_210000.sql
```

---

## 🔍 TROUBLESHOOTING

### Problema: Container não inicia

**Solução:**
```bash
# Ver logs detalhados
docker compose logs app

# Verificar se a porta está em uso
sudo netstat -tulpn | grep 5000

# Limpar containers antigos
docker compose down -v
docker compose up -d --build
```

### Problema: Erro de conexão com banco

**Solução:**
```bash
# Verificar se o banco está rodando
docker compose ps

# Ver logs do banco
docker compose logs db

# Verificar variáveis de ambiente
docker compose exec app env | grep DATABASE_URL
```

### Problema: Erro 502 Bad Gateway (Nginx)

**Solução:**
```bash
# Verificar se a aplicação está rodando
curl http://localhost:5000/health

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📊 MONITORAMENTO

### Verificar Saúde do Sistema

```bash
# Status dos containers
docker compose ps

# Uso de recursos
docker stats

# Espaço em disco
df -h

# Logs recentes
docker compose logs --tail=100
```

### Configurar Monitoramento Automático

Recomendamos usar:
- **Uptime Robot** - Monitoramento de uptime gratuito
- **Sentry** - Monitoramento de erros
- **Grafana + Prometheus** - Métricas avançadas

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
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 📈 PERFORMANCE

### Otimizações Recomendadas

1. **Nginx Caching**
   - Configure cache para assets estáticos

2. **PostgreSQL Tuning**
   - Ajuste `shared_buffers`, `work_mem` conforme RAM disponível

3. **Docker Resources**
   - Limite recursos no `docker-compose.yml` se necessário

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
```

### Contato

- **Issues:** https://github.com/admvilsonmarcio-sketch/casadf-crm/issues
- **Email:** suporte@casadf.com.br

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy concluído:

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
