import Anthropic from "@anthropic-ai/sdk"
import type { AgentContext } from "@/types"
import { formatCurrency, getCurrentMonthName } from "@/lib/utils"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── System Prompt (será cacheado pela Anthropic) ─────────
function buildSystemPrompt(ctx: AgentContext): string {
  const { user, currentMonth, ytdRevenue } = ctx
  const MEI_LIMIT = 8_100_000  // R$81.000 em centavos
  const remaining = MEI_LIMIT - ytdRevenue
  const monthName = getCurrentMonthName()

  return `Você é o MEI Certo, assistente financeiro do(a) ${user.name}.
${user.cnpj ? `CNPJ: ${user.cnpj}` : "MEI ainda sem CNPJ cadastrado."}
Plano atual: ${user.plan}

═══ DADOS DE ${monthName.toUpperCase()} ═══
Entradas:    ${formatCurrency(currentMonth.income)}
Saídas:      ${formatCurrency(currentMonth.expense)}
DAS estimado: ${formatCurrency(currentMonth.dasEstimate)}

═══ ANO CORRENTE ═══
Faturamento acumulado: ${formatCurrency(ytdRevenue)}
Saldo até teto MEI:    ${formatCurrency(remaining)} de ${formatCurrency(MEI_LIMIT)}
${ytdRevenue > MEI_LIMIT * 0.8 ? "⚠️ ATENÇÃO: Você está se aproximando do teto anual do MEI (R$81.000)!" : ""}

═══ REGRAS DE COMPORTAMENTO ═══
1. Respostas curtas (máx 3-4 linhas no WhatsApp)
2. Sempre confirme registros com ✅
3. Fale de forma simples e amigável, como um amigo que entende de finanças
4. Separe despesas PJ (do negócio) de PF (pessoais)
5. Conheça e use: DAS (guia de pagamento MEI), teto MEI, categorias brasileiras
6. Ao registrar, SEMPRE responda com o JSON estruturado abaixo
7. NUNCA use markdown como #, ##, --- ou ___. Use apenas *texto* para negrito (compatível com WhatsApp)

═══ CATEGORIAS DE DESPESA ═══
Operacional: Combustível, Material, Aluguel, Internet, Telefone, Software
Pessoal: Alimentação, Saúde, Transporte, Lazer (marcar como PF)
Fiscal: DAS, Contador, Taxas

═══ FORMATO DE RESPOSTA PARA REGISTROS ═══
Quando registrar uma transação, responda EXATAMENTE assim (JSON + mensagem):

REGRA CRÍTICA DE VALORES: o campo "amount" deve ser SEMPRE em centavos inteiros.
Exemplos:
  R$1,00   → 100
  R$45,00  → 4500
  R$80,00  → 8000
  R$850,00 → 85000
  R$1.200,00 → 120000

NUNCA use decimais no amount. NUNCA use valores como 8.50, 45.0 ou 0.80.

<transaction>
{
  "action": "register_income" | "register_expense",
  "amount": 85000,
  "category": "Serviços",
  "description": "Serviço de instalação",
  "isPessoal": false
}
</transaction>

Seguido da mensagem amigável para o usuário.

Para consultas (sem registro), responda diretamente sem o bloco JSON.`
}

// ─── Função Principal ─────────────────────────────────────

export interface AgentResponse {
  message: string
  transaction?: {
    action: "register_income" | "register_expense"
    amount: number
    category: string
    description: string
    isPessoal: boolean
  }
  tokensUsed: number
  model: string
}

export async function runAgent(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(ctx)

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  })

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")

  // ─── Extrai JSON de transação se existir ──────────────
  const transactionMatch = rawText.match(/<transaction>([\s\S]*?)<\/transaction>/)
  let transaction: AgentResponse["transaction"] | undefined

  if (transactionMatch) {
    try {
      const parsed = JSON.parse(transactionMatch[1].trim())

      // Garante que o amount está em centavos inteiros
      // Se o Claude retornar decimal (ex: 8.50), converte corretamente
      const rawAmount = parsed.amount as number
      const amountCents = Number.isInteger(rawAmount)
        ? rawAmount
        : Math.round(rawAmount * 100)

      transaction = {
        ...parsed,
        amount: amountCents,
      }
    } catch {
      // JSON malformado — ignora e não registra
    }
  }

  // ─── Mensagem limpa (sem o bloco JSON) ────────────────
  const cleanMessage = rawText
    .replace(/<transaction>[\s\S]*?<\/transaction>/g, "")
    .trim()

  return {
    message: cleanMessage,
    transaction,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    model: "claude-haiku-4-5-20251001",
  }
}

// ─── Agente de Análise Mensal (Sonnet — mais caro, roda 1x/mês) ──

export async function runMonthlyAnalysis(ctx: AgentContext): Promise<string> {
  const { user, currentMonth, ytdRevenue } = ctx

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Você é o MEI Certo, assistente financeiro via WhatsApp.

Gere o resumo mensal do MEI ${user.name} com os dados abaixo.

Dados do mês:
- Entradas: ${formatCurrency(currentMonth.income)}
- Saídas: ${formatCurrency(currentMonth.expense)}
- DAS estimado: ${formatCurrency(currentMonth.dasEstimate)}
- Faturamento no ano: ${formatCurrency(ytdRevenue)}

INSTRUÇÕES:
- Escreva exatamente 4 linhas, cada uma começando com um emoji
- Linha 1: balanço do mês (entradas, saídas, lucro)
- Linha 2: DAS a pagar com vencimento no dia 20
- Linha 3: quanto do teto MEI já foi usado (em % e em reais)
- Linha 4: uma dica prática curta

REGRAS ABSOLUTAS DE FORMATAÇÃO — sem exceções:
- Use apenas *palavra* para negrito (padrão WhatsApp)
- PROIBIDO: #, ##, ###, ---, ___, qualquer outro símbolo markdown
- PROIBIDO: blocos de código, listas com -, listas com *
- PROIBIDO: adicionar qualquer texto além das 4 linhas (sem introdução, sem observações, sem explicações)
- Sua resposta deve conter APENAS as 4 linhas do resumo, nada mais`,
      },
    ],
  })

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
}