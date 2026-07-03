# Deploy SILLION na VPS

Guia de referência para produção — especialmente VPS compartilhada com outras apps no mesmo IP.

## Resumo rápido

| Item | Valor |
|------|-------|
| Pasta na VPS | `/opt/sillion` |
| Repositório | `https://github.com/Maaatheusbraga/SILLION` |
| Acesso (sem domínio) | `http://187.77.240.221:8080` |
| Login master | `http://187.77.240.221:8080/master/login` |
| Nginx público | porta **8080** |
| PM2 / Next.js | `127.0.0.1:3003` |
| Credenciais master | `data/master-auth.json` (não commitar) |

---

## VPS compartilhada (portas)

Esta VPS roda **várias apps** no mesmo IP. O SILLION **não usa a porta 80** (Evolux é o `default_server`).

| App | URL | Nginx → porta interna |
|-----|-----|------------------------|
| Evolux | `http://187.77.240.221` | `127.0.0.1:3002` |
| Braga Solutions | `bragasolutionsti.com` | `127.0.0.1:3001` |
| Skedu | `appskedu.com` | `127.0.0.1:3000` |
| **SILLION** | `http://187.77.240.221:8080` | `127.0.0.1:3003` |

Arquivos de config:

- PM2: `deploy/ecosystem.ip.config.cjs`
- Nginx: `/etc/nginx/conf.d/sillion.conf` (gerado por `deploy/nginx/install.sh ip`)

---

## Primeiro deploy (modo IP)

```bash
cd /opt/sillion
git pull
npm install
npm run build

# Credenciais master (grava data/master-auth.json + .env.production)
npm run master:set -- 'SUA_SENHA_AQUI'
npm run master:verify -- 'SUA_SENHA_AQUI'

# Nginx + PM2 + firewall 8080
bash deploy/nginx/install.sh ip 187.77.240.221

# Confirma login na API
npm run master:test-login -- 'SUA_SENHA_AQUI'
```

---

## Atualizar após `git pull`

```bash
cd /opt/sillion
git pull
npm run build
npm run deploy:restart-ip
```

**Importante:** não use `pm2 restart sillion` — ele **mantém a porta antiga** do processo. Sempre use:

```bash
npm run deploy:restart-ip
```

Isso executa: `pm2 delete sillion` → `pm2 start deploy/ecosystem.ip.config.cjs` → `pm2 save`.

---

## Credenciais master

### Onde ficam

| Arquivo | Uso |
|---------|-----|
| `data/master-auth.json` | **Fonte principal** lida pelo app em runtime |
| `.env.production` | Backup / compatibilidade |
| `.env.local` | **Não** coloque `MASTER_*` aqui — sobrescreve produção |

O arquivo `data/master-auth.json` está no `.gitignore` e **nunca vai pro GitHub**.

### Definir ou trocar senha

```bash
cd /opt/sillion
npm run master:set -- 'SUA_SENHA'
npm run master:verify -- 'SUA_SENHA'
npm run deploy:restart-ip
npm run master:test-login -- 'SUA_SENHA'
```

### Gerar hash manualmente (se precisar)

```bash
npm run master:hash -- 'SUA_SENHA'
```

Se colar hash no `.env.production`, **sempre com aspas duplas**:

```env
MASTER_PASSWORD_HASH="$2b$10$..."
```

O `$` do bcrypt quebra sem aspas (dotenv/Next.js corrompe o valor).

### Variáveis úteis em `.env.production`

```env
JWT_SECRET=segredo-longo-aleatorio
MASTER_USERNAME=MatheusBraga
COOKIE_SECURE=false
```

`COOKIE_SECURE=false` é obrigatório em HTTP (sem domínio/SSL). O PM2 já define isso em `deploy/ecosystem.ip.config.cjs`.

---

## Scripts npm (produção)

| Comando | Descrição |
|---------|-----------|
| `npm run master:set -- SENHA` | Grava credenciais em `data/master-auth.json` |
| `npm run master:verify -- SENHA` | Valida hash e testa senha |
| `npm run master:test-login -- SENHA` | Testa `POST /api/master/login` na porta 3003 |
| `npm run deploy:restart-ip` | Recria processo PM2 na porta 3003 |
| `bash deploy/nginx/install.sh ip IP` | Configura Nginx 8080 → 3003 |

---

## Diagnóstico

```bash
cd /opt/sillion

# PM2
pm2 list
pm2 show sillion
pm2 logs sillion --lines 50

# Portas
ss -tlnp | grep -E "3003|8080"

# Teste local
curl -I http://127.0.0.1:8080
curl -I http://127.0.0.1:3003
npm run master:test-login -- 'SUA_SENHA'

# Nginx
cat /etc/nginx/conf.d/sillion.conf
nginx -t && systemctl reload nginx

# Firewall (se 8080 não abrir no navegador)
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

### Erros comuns

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Credenciais inválidas | Hash corrompido no `.env` ou `.env.local` sobrescrevendo | `npm run master:set -- SENHA` |
| `ECONNREFUSED 127.0.0.1:3003` | PM2 na porta errada | `npm run deploy:restart-ip` |
| Login OK no teste, falha no browser | Cookie/cache antigo | Aba anônima |
| `git pull` bloqueado | Alteração local em deploy | `git checkout -- deploy/nginx/install.sh` |

---

## Com domínio (futuro)

Quando tiver DNS apontando para a VPS:

```bash
cd /opt/sillion
bash deploy/nginx/install.sh dominio sillion.seudominio.com.br
```

Isso configura HTTPS (Certbot), Nginx na porta 80/443 e PM2 com `deploy/ecosystem.config.cjs` (porta 3000 interna, cookies secure).

Antes do SSL, crie o registro DNS:

```
sillion.seudominio.com.br  A  →  IP_DA_VPS
```

---

## Segurança

- `.env`, `.env.production`, `.env.local` e `data/*.json` **não vão pro Git**
- Senha master é armazenada como **hash bcrypt**, nunca em texto plano
- App escuta só em `127.0.0.1:3003` — acesso externo só via Nginx na 8080
- Acesso SSH à VPS = acesso às credenciais em `data/master-auth.json`

---

## Checklist pós-deploy

- [ ] `pm2 list` → sillion **online**
- [ ] `ss -tlnp | grep 3003` → next-server ouvindo
- [ ] `npm run master:test-login` → **HTTP 200**
- [ ] Browser: `http://IP:8080/master/login` → entra no painel
- [ ] Evolux em `http://IP` continua funcionando
