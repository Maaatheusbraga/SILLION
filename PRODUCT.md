# SILLION — Product Definition

**Status:** MVP fechado (sessão jul/2026) · uso interno · web + mobile

## Register

product

## Users

Equipe comercial pequena (2–5 vendedores) que prospecta clínicas de estética e negócios locais a partir de bases importadas do Google Places (Excel). Trabalham em paralelo sobre a mesma base ativa: todos enxergam os leads da campanha selecionada, e quem registrar o primeiro contato “reserva” o lead para si.

**Contexto de uso:** navegador web em desktop e **celular** (ferramenta de campo — contato via WhatsApp no mobile).

## Product Purpose

SILLION é um CRM de prospecção focado em transformar planilhas de leads (crawler Google Places) em um fluxo de trabalho acionável — não uma planilha glorificada. Importar Excel, priorizar contatos, registrar status e histórico multicanal, e acompanhar follow-ups até conversão ou descarte.

**Sucesso** = equipe sabe exatamente quem contatar, quem já foi abordado, e o que fazer em seguida, sem perder leads na base — inclusive trocando de campanha/região sem apagar usuários ou configurações.

## Brand Personality

**Confiante · Direto · Próprio**

Identidade visual forte e memorável — SILLION tem personalidade, não parece CRM genérico nem interface de planilha. Tom de voz objetivo, orientado à ação (“contatar”, “seguir”, “converter”). A interface serve a velocidade de prospecção, com presença de marca visível.

## Anti-references

- Planilha glorificada (grid denso, cabeçalhos de Excel, sensação de “só importei o xlsx”)
- CRM SaaS branco/cream com cards idênticos e funil genérico copiado de HubSpot/Pipedrive
- Dashboards cheios de métricas hero sem utilidade para quem está ligando agora

## Design Principles

1. **Ação antes de relatório** — a tela principal responde “quem contato agora?”, não “quantos leads existem?”
2. **Claim claro** — reservar lead ao contatar deve ser óbvio e visível para a equipe
3. **Histórico que conta a história** — interações (WhatsApp, ligação, e-mail) com data, canal e comentários; follow-up é o próximo passo explícito
4. **Importação sem dor** — Excel mapeado automaticamente; deduplicação por `place_id` **dentro da mesma base**
5. **Marca presente, tarefa em foco** — identidade SILLION em shell/nav; clareza nas telas de trabalho
6. **Lista como estoque, Kanban como ação** — importação enche a lista; card = decisão de prospectar; status único sincroniza as visões
7. **Mobile como canal principal de contato** — layout responsivo, painéis e modais adaptados ao celular, toque e scroll horizontal no Kanban

## Accessibility & Inclusion

WCAG 2.1 AA como meta. Contraste legível. `prefers-reduced-motion`. Interface em **português (BR)**. Datas no padrão **dd/mm/aaaa**.

---

## MVP entregue

### Autenticação

- Login por **username único** + senha (ex.: `ana`, `bruno`)
- Nome de apresentação e template de mensagem em **Configurações** (não no login)
- Variáveis do template: `{vendedor}`, `{empresa}`, `{cidade}`
- Senhas armazenadas com **bcrypt** em `data/users.json` (servidor only)
- **Painel master** (`/master/login`): acesso restrito ao administrador para criar/remover usuários do CRM
- Cookie HTTP-only separado para sessão master (8h) vs vendedores (7d)
- Dados JSON (`leads`, `datasets`, `users`) **nunca** são expostos ao browser — apenas via API autenticada

### Bases de prospecção (partições)

Cada importação ou campanha vive em uma **base isolada**:

| Ação | Comportamento |
|---|---|
| Importar Excel | Usuário **nomeia a base** (dica: região + nicho); pode criar nova ou adicionar à ativa |
| Seletor no header | Troca a base visível (Lista, Kanban, alertas) |
| Configurações | Criar base vazia, trocar ativa, **apagar base** (remove todos os leads da partição) |
| Duplicatas | `place_id` ignorado **dentro da mesma base**; bases diferentes são independentes |

Persistência: `data/leads.json`, `data/datasets.json`, `data/users.json`.

### Dados de entrada (Excel crawler)

Campos: `title`, `phone_unformatted`, `address`, `neighborhood`, `city`, `postal_code`, `total_score`, `reviews_count`, `place_id`.

### Fluxo Lista → Card → Kanban

Um registro por lead por base. Duas visões, **um status**.

| Estágio | Onde | Status |
|---|---|---|
| Após importação | Lista (estoque) | `importado` |
| Após promover / contatar | Kanban | `nao_contatado` ou `contatado` |
| Pipeline | Kanban (+ lista reflete) | `negociacao` → `convertido` / `descartado` |

**Lista**

- Cards com busca, filtro por status, só importados / só cards
- **Contatar** → WhatsApp + confirmação → status `contatado` + card no Kanban
- **Tornar card** → coluna *Não contatado*

**Kanban**

- Drag-and-drop (mouse e toque)
- Modal ao mover para *Contatado* (canal + nota)
- Claim: responsável vinculado ao vendedor logado

**Painel do lead**

- Comentários (histórico), interações multicanal, follow-up com calendário pt-BR
- Ações: WhatsApp, ligação, e-mail, copiar mensagem inicial

**Alertas**

- Sino de follow-ups vencidos / para hoje (base ativa)
- Filtro na lista via `?followup=due`

### Navegação

Lista · Kanban · Configurações (tema claro/escuro, bases, perfil de contato)

### Stack (MVP)

Next.js 15 · React 19 · Tailwind CSS 4 · @dnd-kit · xlsx · JSON local

---

## Fora do MVP (fase 2+)

- Sync na nuvem / multi-máquina
- Relatórios de performance por vendedor
- Mapa por coordenadas
- Automação de follow-up (push/e-mail)
- Preview de linhas antes de importar
- Filtros avançados (responsável, nota mínima) na lista
- Redefinição de senha pelo próprio vendedor

---

## Checklist de validação (equipe)

1. [ ] Criar base nomeada → importar Excel
2. [ ] Contatar lead pela lista no celular
3. [ ] Promover lead → mover no Kanban
4. [ ] Registrar follow-up → ver alerta
5. [ ] Trocar de base → apagar base antiga
6. [ ] Dois vendedores: claim visível ao contatar o mesmo lead
