import { NextRequest, NextResponse } from "next/server"
import { normalizePhone, extractMessageText, sendText, sendTyping } from "@/lib/evolution/client"
import { getAgentContext, upsertUser, createTransaction, logMessage } from "@/lib/supabase/queries"
import { runAgent } from "@/lib/claude/agent"
import { parseCurrencyToCents } from "@/lib/utils"
import type { EvolutionWebhookPayload } from "@/types"

// ─── Mensagens de sistema ──────────────────────────────────
const MSG_ERROR = "Opa, tive um problema aqui 😅 Tenta de novo em segundos!"
const MSG_WELCOME = (name: string) =>
  `Oi ${name}! 👋 Sou o *MEI Certo*, seu assistente financeiro.\n\nPode me contar qualquer movimentação do seu negócio:\n\n💰 "Recebi R$500 de um cliente"\n💸 "Paguei R$80 de combustível"\n📊 "Como tá o mês?"\n\nVou organizar tudo pra você!`

// ─── POST /api/webhook/whatsapp ───────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await req.json()) as EvolutionWebhookPayload

    // Só processa mensagens recebidas (não as enviadas pelo bot)
    if (
      payload.event !== "messages.upsert" ||
      payload.data?.key?.fromMe === true
    ) {
      return NextResponse.json({ ok: true })
    }

    const { key, message, pushName } = payload.data

    // Extrai texto da mensagem
    const text = extractMessageText({ key, message })
    if (!text || text === "[áudio]") {
      // Áudio: responde instruindo a usar texto por enquanto
      if (text === "[áudio]") {
        const phone = normalizePhone(key.remoteJid)
        await sendText(phone, "Ainda não processo áudios 🎤 Me manda em texto, por favor!")
      }
      return NextResponse.json({ ok: true })
    }

    const phone = normalizePhone(key.remoteJid)
    const name = pushName ?? "MEI"

    // ─── Log da mensagem recebida ──────────────────────
    await logMessage({
      userId: null,  // preenchido depois do upsert
      direction: "inbound",
      content: text,  // TODO: sanitizar dados sensíveis
    })

    // ─── Upsert do usuário ─────────────────────────────
    const user = await upsertUser(phone, name)

    // Primeiro acesso → mensagem de boas-vindas
    const isFirstMessage =
      new Date(user.created_at).getTime() > Date.now() - 5000

    if (isFirstMessage) {
      await sendText(phone, MSG_WELCOME(user.name))
      return NextResponse.json({ ok: true })
    }

    // ─── Plano trial expirado ──────────────────────────
    if (
      user.plan === "trial" &&
      user.trial_ends_at &&
      new Date(user.trial_ends_at) < new Date()
    ) {
      await sendText(
        phone,
        `Seu período de teste acabou, ${user.name} 😢\n\nPara continuar usando o MEI Certo, assine por apenas *R$29/mês*:\n👉 meicerto.com.br/assinar`
      )
      return NextResponse.json({ ok: true })
    }

    // ─── Simula "digitando..." ─────────────────────────
    await sendTyping(phone, 1500)

    // ─── Busca contexto do agente ──────────────────────
    const ctx = await getAgentContext(phone)
    if (!ctx) {
      await sendText(phone, MSG_ERROR)
      return NextResponse.json({ ok: true })
    }

    // ─── Chama o agente Claude ─────────────────────────
    const agentResult = await runAgent(text, ctx)

    // ─── Persiste transação se houver ──────────────────
    if (agentResult.transaction) {
      const { action, amount, category, description } = agentResult.transaction

      // Converte se o Claude retornou em reais em vez de centavos
      const amountCents = amount < 1000 ? Math.round(amount * 100) : amount

      await createTransaction(user.id, {
        type: action === "register_income" ? "income" : "expense",
        amount: amountCents,
        category,
        description,
        rawMessage: text,
      })
    }

    // ─── Envia resposta ao usuário ─────────────────────
    await sendText(phone, agentResult.message)

    // ─── Log da resposta ───────────────────────────────
    await logMessage({
      userId: user.id,
      direction: "outbound",
      content: agentResult.message,
      tokensUsed: agentResult.tokensUsed,
      model: agentResult.model,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Webhook] Erro não tratado:", err)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}

// GET para health check (Evolution API verifica se o webhook está vivo)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "ok", service: "mei-certo-webhook" })
}
