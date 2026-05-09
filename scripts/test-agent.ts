/**
 * Teste isolado do agente Claude — MEI Rendeu
 * 
 * Uso:
 *   npx tsx scripts/test-agent.ts
 * 
 * Requer ANTHROPIC_API_KEY no .env.local
 */

import * as dotenv from "dotenv"
import * as path from "path"

// Carrega .env.local antes de tudo
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

import { runAgent, runMonthlyAnalysis } from "../src/lib/claude/agent"
import type { AgentContext } from "../src/types"

// ─── Contexto fake de um MEI típico ──────────────────────
const mockCtx: AgentContext = {
  user: {
    id: "test-user-001",
    phone: "5583999990001",
    name: "João Silva",
    cnpj: "12.345.678/0001-99",
    plan: "basic",
    trial_ends_at: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    monthly_revenue_ytd: 4_230_00, // R$4.230,00 acumulado no ano
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  currentMonth: {
    income: 3_850_00,    // R$3.850,00
    expense: 1_240_00,   // R$1.240,00
    dasEstimate: 6_700,  // R$67,00
    transactionCount: 8,
  },
  ytdRevenue: 4_230_00,
}

// ─── Casos de teste ───────────────────────────────────────
const testCases = [
  {
    label: "Registro de receita",
    message: "Recebi R$850 de um cliente hoje pelo serviço de instalação",
  },
  {
    label: "Registro de despesa",
    message: "Paguei R$80 de combustível hoje",
  },
  {
    label: "Consulta de saldo",
    message: "Como tá o mês?",
  },
  {
    label: "Consulta de teto MEI",
    message: "Quanto ainda posso faturar esse ano?",
  },
  {
    label: "Dúvida sobre DAS",
    message: "Quando vence o DAS esse mês?",
  },
  {
    label: "Despesa pessoal (deve marcar como PF)",
    message: "Gastei R$45 no almoço hoje",
  },
]

// ─── Runner ───────────────────────────────────────────────
async function runTests() {
  console.log("\n╔══════════════════════════════════════════╗")
  console.log("║      MEI RENDEU — TESTE DO AGENTE         ║")
  console.log("╚══════════════════════════════════════════╝\n")

  let passed = 0
  let failed = 0

  for (const tc of testCases) {
    console.log(`\n──── ${tc.label} ────`)
    console.log(`📱 Input: "${tc.message}"`)

    try {
      const result = await runAgent(tc.message, mockCtx)

      console.log(`🤖 Resposta: ${result.message}`)

      if (result.transaction) {
        console.log(`📝 Transação detectada:`)
        console.log(`   Ação: ${result.transaction.action}`)
        console.log(`   Valor: R$${(result.transaction.amount / 100).toFixed(2)}`)
        console.log(`   Categoria: ${result.transaction.category}`)
        console.log(`   Descrição: ${result.transaction.description}`)
        console.log(`   É pessoal: ${result.transaction.isPessoal}`)
      } else {
        console.log(`ℹ️  Sem transação registrada (só consulta)`)
      }

      console.log(`🔢 Tokens: ${result.tokensUsed}`)
      passed++
    } catch (err) {
      console.error(`❌ ERRO: ${err}`)
      failed++
    }

    // Delay entre chamadas para não bater rate limit
    await sleep(1000)
  }

  // ─── Teste da análise mensal (Sonnet) ──────────────────
  console.log("\n\n──── Análise Mensal (Sonnet) ────")
  console.log("📊 Gerando resumo do mês...")

  try {
    const analysis = await runMonthlyAnalysis(mockCtx)
    console.log(`\n${analysis}`)
    passed++
  } catch (err) {
    console.error(`❌ ERRO na análise mensal: ${err}`)
    failed++
  }

  // ─── Resultado final ───────────────────────────────────
  console.log("\n\n╔══════════════════════════════════════════╗")
  console.log(`║  Resultado: ${passed} passaram, ${failed} falharam         ║`)
  console.log("╚══════════════════════════════════════════╝\n")
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

runTests().catch(console.error)