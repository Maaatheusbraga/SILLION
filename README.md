# SILLION

CRM de prospecção B2B — importe Excel, trabalhe por campanha (base), contate pelo celular e acompanhe o pipeline no Kanban.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

### Contas demo

Usuários são criados pelo **painel master** em `/master/login`. Contas existentes em `data/users.json` continuam válidas.

## Painel master (administrador)

URL: **`/master/login`** — acesso restrito para criar/remover logins do CRM.

Credenciais configuráveis via `data/master-auth.json` (produção) ou `.env.local` (dev). Senhas hasheadas com bcrypt; a API nunca devolve hashes. Ver [deploy/DEPLOY.md](./deploy/DEPLOY.md).

## Fluxo principal

1. **Importar Excel** — nomeie a base (ex.: *João Pessoa · Estética*); dedupe por `place_id` na mesma base
2. **Lista** — estoque, **Contatar** (WhatsApp) ou **Tornar card**
3. **Kanban** — drag-and-drop; claim ao registrar contato
4. **Configurações** — bases (criar/apagar), perfil, tema claro/escuro

## Bases de prospecção

Cada campanha/região pode ser uma base separada. Use o seletor no topo para trocar. Em Configurações, apague bases que não usa mais — remove só os leads daquela partição.

## Mobile

Interface responsiva: seletor de base em barra dedicada no celular, Kanban com scroll horizontal, painel do lead em folha inferior, modais adaptados à largura da tela.

## Dados locais

Arquivos em `data/` (`leads.json`, `datasets.json`, `users.json`). Faça backup antes de apagar bases ou resetar.

## Stack

Next.js 15 · React 19 · Tailwind CSS 4 · @dnd-kit · xlsx

Escopo completo: [PRODUCT.md](./PRODUCT.md)

## Deploy (VPS)

Produção na VPS compartilhada: **porta 8080** (Nginx) → **3003** (PM2). Guia completo:

**[deploy/DEPLOY.md](./deploy/DEPLOY.md)**

Comandos essenciais na VPS:

```bash
cd /opt/sillion
git pull && npm run build && npm run deploy:restart-ip
npm run master:set -- 'SUA_SENHA'   # credenciais master
npm run master:test-login -- 'SUA_SENHA'
```
