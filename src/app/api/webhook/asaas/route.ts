import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { sendText } from "@/lib/evolution/client"

// ─── Tipos do payload do Asaas ────────────────────────────
interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  value: number
  status: string
  externalReference?: string
  description?: string
}

interface AsaasSubscription {
  id: string
  customer: string
  status: "ACTIVE" | "INACTIVE" | "EXPIRED"
  value: number
  description?: string
  externalReference?: string // nosso user_id
}

interface AsaasWebhookPayload {
  id: string
  event: string
  dateCreated: string
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

// ─── Mapeamento valor → plano ─────────────────────────────
function getPlanByValue(value: number): "basic" | "pro" {
  if (value >= 49) return "pro"
  return "basic"
}

// ─── Mensagens WhatsApp ───────────────────────────────────
const MSG = {
  activated: (plan: "basic" | "pro") =>
    plan === "pro"
      ? `✅ *Plano Pro ativado!*\n\nAgora você tem acesso a:\n📊 Análises financeiras com IA\n📄 Gerador de contratos\n📈 Relatórios mensais em PDF\n💰 Calculadora de precificação\n\nPode usar tudo por aqui mesmo. Bora! 🚀`
      : `✅ *Plano Básico ativado!*\n\nAgora você tem acesso completo ao MEI Rendeu:\n💰 Registre receitas e despesas\n📅 Lembretes do DAS\n🚦 Alertas de teto MEI\n📊 Resumo mensal\n\nQualquer dúvida é só me chamar! 😊`,

  paymentOverdue:
    `⚠️ *Pagamento em atraso*\n\nSua cobrança do MEI Rendeu está em aberto. Pague pelo link que você recebeu por e-mail para manter o acesso.\n\nQualquer dúvida responda aqui.`,

  canceled:
    `😢 *Assinatura cancelada*\n\nSua assinatura foi encerrada. Você ainda pode usar o MEI Rendeu gratuitamente por 7 dias.\n\nPara reativar: meirendeu.com.br/assinar`,
}

// ─── POST /api/webhook/asaas ──────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Valida o token de segurança do Asaas
  const token = req.headers.get("asaas-access-token")
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    console.error("[Asaas Webhook] Token inválido")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: AsaasWebhookPayload

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Idempotência — ignora eventos já processados
  const { data: jaProcessado } = await supabaseAdmin
    .from("alerts")
    .select("id")
    .eq("payload->>'asaasEventId'", payload.id)
    .single()

  if (jaProcessado) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    switch (payload.event) {
      // ─── Pagamento recebido (PIX, boleto ou cartão) ──
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        const payment = payload.payment
        if (!payment) break

        // Busca usuário pelo externalReference (user_id) ou pelo asaas_customer_id
        const user = await findUser(
          payment.externalReference,
          payment.customer
        )
        if (!user) break

        const plan = getPlanByValue(payment.value)

        await supabaseAdmin
          .from("users")
          .update({
            plan,
            asaas_customer_id: payment.customer,
            asaas_subscription_id: payment.subscription ?? null,
          })
          .eq("id", user.id)

        // Notifica apenas no primeiro pagamento da assinatura
        if (user.plan === "trial" || user.plan !== plan) {
          await sendText(user.phone, MSG.activated(plan))
        }

        await logAsaasEvent(user.id, payload)
        break
      }

      // ─── Pagamento em atraso ─────────────────────────
      case "PAYMENT_OVERDUE": {
        const payment = payload.payment
        if (!payment) break

        const user = await findUser(
          payment.externalReference,
          payment.customer
        )
        if (!user) break

        await sendText(user.phone, MSG.paymentOverdue)
        await logAsaasEvent(user.id, payload)
        break
      }

      // ─── Assinatura inativada ou removida ─────────────
      case "SUBSCRIPTION_INACTIVATED":
      case "SUBSCRIPTION_DELETED": {
        const subscription = payload.subscription
        if (!subscription) break

        const user = await findUser(
          subscription.externalReference,
          subscription.customer
        )
        if (!user) break

        await supabaseAdmin
          .from("users")
          .update({
            plan: "trial",
            asaas_subscription_id: null,
            trial_ends_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("id", user.id)

        await sendText(user.phone, MSG.canceled)
        await logAsaasEvent(user.id, payload)
        break
      }

      default:
        // Ignora eventos não tratados sem erro
        break
    }
  } catch (err) {
    console.error("[Asaas Webhook] Erro ao processar evento:", payload.event, err)
    // Retorna 200 para não pausar a fila do Asaas
    // (erros de lógica não devem bloquear o webhook)
  }

  return NextResponse.json({ received: true })
}

// ─── Helpers ──────────────────────────────────────────────

async function findUser(
  externalReference?: string,
  asaasCustomerId?: string
): Promise<{ id: string; phone: string; plan: string } | null> {
  // Tenta pelo externalReference (user_id) primeiro — mais confiável
  if (externalReference) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, phone, plan")
      .eq("id", externalReference)
      .single()
    if (data) return data
  }

  // Fallback: busca pelo asaas_customer_id
  if (asaasCustomerId) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, phone, plan")
      .eq("asaas_customer_id", asaasCustomerId)
      .single()
    if (data) return data
  }

  return null
}

async function logAsaasEvent(
  userId: string,
  payload: AsaasWebhookPayload
): Promise<void> {
  await supabaseAdmin.from("alerts").insert({
    user_id: userId,
    type: "low_balance", // reutilizando tipo existente para log
    scheduled_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
    payload: {
      asaasEventId: payload.id,
      event: payload.event,
      dateCreated: payload.dateCreated,
    },
  })
}