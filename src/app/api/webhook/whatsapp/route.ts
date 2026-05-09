import { NextRequest, NextResponse } from "next/server"
import { normalizePhone, extractMessageText, sendText, sendTyping } from "@/lib/evolution/client"
import { getAgentContext, upsertUser, createTransaction, logMessage } from "@/lib/supabase/queries"
import { runAgent } from "@/lib/claude/agent"
import { handleOnboarding, getOnboardingStep } from "@/lib/onboarding/flow"
import type { EvolutionWebhookPayload } from "@/types"

// ─── Mensagens de sistema ──────────────────────────────────
const MSG_ERROR = "Opa, tive um problema aqui 😅 Tenta de novo em segundos!"

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
    if (!text) return NextResponse.json({ ok: true })

    // Áudio: responde instruindo a usar texto por enquanto
    if (text === "[áudio]") {
      const phone = normalizePhone(key.remoteJid)
      await sendText(phone, "Ainda não processo áudios 🎤 Me manda em texto, por favor!")
      return NextResponse.json({ ok: true })
    }

    const phone = normalizePhone(key.remoteJid)
    const name = pushName ?? "MEI"

    // ─── Upsert do usuário ─────────────────────────────────
    const user = await upsertUser(phone, name)

    // ─── Plano trial expirado ──────────────────────────────
    if (
      user.plan === "trial" &&
      user.trial_ends_at &&
      new Date(user.trial_ends_at) < new Date()
    ) {
      await sendText(
        phone,
        `Seu período de teste acabou, ${user.name} 😢\n\nPara continuar usando o *MeiRendeu*, assine por apenas *R$29/mês*:\n👉 mei-rendeu.com.br/assinar`
      )
      return NextResponse.json({ ok: true })
    }

    // ─── Onboarding ────────────────────────────────────────
    const onboardingStep = await getOnboardingStep(user.id)
    if (onboardingStep !== "done") {
      const stillOnboarding = await handleOnboarding(user, text, phone)
      if (stillOnboarding) return NextResponse.json({ ok: true })
      // Se retornou false, o onboarding acabou nessa mensagem
      // e a mensagem atual já foi a escolha da área — não passa pro agente
      return NextResponse.json({ ok: true })
    }

    // ─── Simula "digitando..." ─────────────────────────────
    await sendTyping(phone, 1500)

    // ─── Log da mensagem recebida ──────────────────────────
    await logMessage({
      userId: user.id,
      direction: "inbound",
      content: text,
    })

    // ─── Busca contexto do agente ──────────────────────────
    const ctx = await getAgentContext(phone)
    if (!ctx) {
      await sendText(phone, MSG_ERROR)
      return NextResponse.json({ ok: true })
    }

    // ─── Chama o agente Claude ─────────────────────────────
    const agentResult = await runAgent(text, ctx)

    // ─── Persiste transação se houver ──────────────────────
    if (agentResult.transaction) {
      const { action, amount, category, description } = agentResult.transaction
      const amountCents = Number.isInteger(amount)
        ? amount
        : Math.round(amount * 100)

      await createTransaction(user.id, {
        type: action === "register_income" ? "income" : "expense",
        amount: amountCents,
        category,
        description,
        rawMessage: text,
      })
    }

    // ─── Envia resposta ao usuário ─────────────────────────
    await sendText(phone, agentResult.message)

    // ─── Log da resposta ───────────────────────────────────
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
  return NextResponse.json({ status: "ok", service: "mei-rendeu-webhook" })
}