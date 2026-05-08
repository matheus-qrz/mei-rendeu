import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase/client"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// ─── POST /api/webhook/stripe ─────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[Stripe Webhook] Assinatura inválida:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // ─── Mapeamento de Price ID → Plano ───────────────────
  const priceToplan: Record<string, "basic" | "pro"> = {
    [process.env.STRIPE_PRICE_BASIC_MONTHLY!]: "basic",
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]: "pro",
    [process.env.STRIPE_PRICE_PRO_YEARLY!]: "pro",
  }

  switch (event.type) {
    // Assinatura criada ou renovada
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price.id
      const plan = priceToplan[priceId] ?? "basic"

      await supabaseAdmin
        .from("users")
        .update({
          plan: sub.status === "active" ? plan : "trial",
          stripe_subscription_id: sub.id,
        })
        .eq("stripe_customer_id", customerId)

      break
    }

    // Assinatura cancelada ou pagamento falhou
    case "customer.subscription.deleted":
    case "invoice.payment_failed": {
      const obj = event.data.object as Stripe.Subscription | Stripe.Invoice
      const customerId =
        "customer" in obj ? (obj.customer as string) : null

      if (customerId) {
        await supabaseAdmin
          .from("users")
          .update({ plan: "trial", stripe_subscription_id: null })
          .eq("stripe_customer_id", customerId)
      }

      break
    }

    default:
      // Ignora eventos não tratados
      break
  }

  return NextResponse.json({ received: true })
}
