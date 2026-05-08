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

═══ CATEGORIAS DE DESPESA ═══
Operacional: Combustível, Material, Aluguel, Internet, Telefone, Software
Pessoal: Alimentação, Saúde, Transporte, Lazer (marcar como PF)
Fiscal: DAS, Contador, Taxas

═══ FORMATO DE RESPOSTA PARA REGISTROS ═══
Quando registrar uma transação, responda EXATAMENTE assim (JSON + mensagem):

<transaction>
{
  "action": "register_income" | "register_expense",
  "amount": 15000,
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
      transaction = JSON.parse(transactionMatch[1].trim())
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
        content: `Gere um resumo financeiro mensal para o MEI ${user.name}.

Dados do mês:
- Entradas: ${formatCurrency(currentMonth.income)}
- Saídas: ${formatCurrency(currentMonth.expense)}
- DAS estimado: ${formatCurrency(currentMonth.dasEstimate)}
- Faturamento no ano: ${formatCurrency(ytdRevenue)}

Escreva um resumo amigável de até 5 linhas para WhatsApp:
1. Balanço do mês (positivo/negativo)
2. DAS a pagar (com data: dia 20)
3. Situação do teto MEI
4. Uma dica prática

Use emojis. Seja direto e positivo.`,
      },
    ],
  })

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
}
