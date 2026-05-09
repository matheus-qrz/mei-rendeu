import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import {
  upsertAsaasCustomer,
  createAsaasSubscription,
  getSubscriptionPaymentLink,
} from "@/lib/asaas/client"

// ─── POST /api/subscribe ──────────────────────────────────
// Cria assinatura no Asaas e retorna URL de pagamento

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { phone, plan, name, cpfCnpj, email } = body

    // ─── Validação básica ──────────────────────────────
    if (!phone || !plan || !name || !cpfCnpj || !email) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    if (plan !== "basic" && plan !== "pro") {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      )
    }

    // ─── Busca o usuário pelo telefone ─────────────────
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, phone")
      .eq("phone", phone)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado. Mande uma mensagem no WhatsApp primeiro." },
        { status: 404 }
      )
    }

    // ─── Cria ou recupera o cliente no Asaas ───────────
    const customer = await upsertAsaasCustomer({
      name,
      cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      mobilePhone: phone,
      email,
    })

    // ─── Cria a assinatura ─────────────────────────────
    const subscription = await createAsaasSubscription({
      customerId: customer.id,
      plan,
      userId: user.id,
    })

    // ─── Salva os IDs do Asaas no usuário ──────────────
    await supabaseAdmin
      .from("users")
      .update({
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
      })
      .eq("id", user.id)

    // ─── Busca o link de pagamento da primeira fatura ──
    const paymentUrl = await getSubscriptionPaymentLink(subscription.id)

    if (!paymentUrl) {
      return NextResponse.json(
        { error: "Erro ao gerar link de pagamento. Tente novamente." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      paymentUrl,
      subscriptionId: subscription.id,
    })
  } catch (err) {
    console.error("[subscribe] Erro:", err)
    return NextResponse.json(
      { error: "Erro interno. Tente novamente em alguns segundos." },
      { status: 500 }
    )
  }
}