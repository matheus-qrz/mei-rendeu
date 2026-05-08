# MEI Certo 🧾

Agente financeiro para MEIs via WhatsApp — built by @matheus-qrz

## Stack

- **Frontend/API**: Next.js 15 + TypeScript + Tailwind v4
- **Banco**: Supabase (PostgreSQL + Auth)
- **IA**: Claude API (Haiku 4.5 + Sonnet 4.6)
- **WhatsApp**: Evolution API (self-hosted)
- **Pagamentos**: Stripe + Abacatepay (PIX)
- **Deploy**: Vercel (Next.js) + Railway (Evolution API)

---

## Setup Local

### 1. Clonar e instalar

```bash
git clone https://github.com/matheus-qrz/mei-certo
cd mei-certo
npm install
cp .env.example .env.local
```

### 2. Supabase

```bash
# Instala CLI
npm install -g supabase

# Inicia projeto local
supabase init
supabase start

# Aplica as migrations
supabase db push

# Gera os tipos TypeScript
npm run db:types
```

### 3. Evolution API (WhatsApp)

```bash
# Sobe o container
cd docker
docker-compose up -d

# Cria a instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SEU_EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "meicerto", "qrcode": true}'

# Pega o QR Code
curl http://localhost:8080/instance/connect/meicerto \
  -H "apikey: SEU_EVOLUTION_API_KEY"

# Escaneie com o número do MEI Certo
```

### 4. Configurar variáveis de ambiente

Preencha o `.env.local` com:
- Chaves do Supabase (dashboard → Settings → API)
- `ANTHROPIC_API_KEY` (console.anthropic.com)
- `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
- Chaves do Stripe (dashboard.stripe.com)

### 5. Rodar

```bash
npm run dev
# http://localhost:3000
```

### 6. Expor webhook localmente (dev)

```bash
# Instala ngrok
npx ngrok http 3000

# Configura a URL no Evolution API
# WEBHOOK_GLOBAL_URL=https://xxxx.ngrok.io/api/webhook/whatsapp
```

---

## Estrutura

```
src/
├── app/
│   ├── api/
│   │   ├── webhook/
│   │   │   ├── whatsapp/route.ts  ← Coração do agente
│   │   │   └── stripe/route.ts    ← Assinaturas
│   │   ├── subscription/          ← Criar checkout session
│   │   └── user/                  ← CRUD de usuário
│   └── dashboard/                 ← Interface web
├── lib/
│   ├── claude/agent.ts            ← Lógica do agente IA
│   ├── evolution/client.ts        ← Cliente WhatsApp
│   ├── supabase/
│   │   ├── client.ts              ← Admin + público
│   │   └── queries.ts             ← Todas as queries
│   └── utils.ts                   ← Formatação, datas
├── types/index.ts                 ← Tipos TypeScript
supabase/
└── migrations/001_initial_schema.sql
docker/
└── docker-compose.yml             ← Evolution API
```

---

## Fluxo do Agente

```
MEI → WhatsApp
     ↓
Evolution API (webhook)
     ↓
POST /api/webhook/whatsapp
     ↓
getAgentContext() ← Supabase
     ↓
runAgent() ← Claude Haiku 4.5
     ↓
createTransaction() ← Supabase
     ↓
sendText() ← Evolution API
     ↓
MEI recebe resposta
```

---

## Custos Estimados

| Serviço | Custo |
|---|---|
| Vercel | Grátis (até 100k req/mês) |
| Supabase | Grátis (até 500MB) |
| Railway (Evolution) | ~$5-10/mês |
| Claude API (200 users) | ~R$110/mês |
| **Total** | **~R$160-200/mês** |

---

## Roadmap

- [x] Schema Supabase
- [x] Agente Claude (Haiku)
- [x] Webhook WhatsApp
- [x] Webhook Stripe
- [ ] Dashboard web
- [ ] Onboarding via WhatsApp
- [ ] Resumo mensal automático (Sonnet)
- [ ] Leitura de foto/comprovante
- [ ] Meta API Oficial (v2)

---

## Licença

MIT — matheus-qrz
