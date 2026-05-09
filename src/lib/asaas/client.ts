// src/lib/asaas/client.ts

const ASAAS_URL = process.env.ASAAS_API_URL ?? "https://api.asaas.com/v3"
const ASAAS_KEY = process.env.ASAAS_API_KEY!

// ─── Planos → valores e descrições ───────────────────────
export const PLANOS = {
  basic: {
    value: 29.0,
    description: "MEI Rendeu — Plano Básico",
  },
  pro: {
    value: 49.0,
    description: "MEI Rendeu — Plano Pro",
  },
} as const

// ─── Types ────────────────────────────────────────────────
export interface AsaasCustomer {
  id: string
  name: string
  cpfCnpj: string
  mobilePhone?: string
  email?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  status: "ACTIVE" | "INACTIVE" | "EXPIRED"
  value: number
  nextDueDate: string
  cycle: "MONTHLY" | "YEARLY"
  description: string
  externalReference?: string
}

// ─── Headers padrão ───────────────────────────────────────
function headers() {
  return {
    "Content-Type": "application/json",
    access_token: ASAAS_KEY,
  }
}

// ─── Criar ou buscar cliente ──────────────────────────────
export async function upsertAsaasCustomer(data: {
  name: string
  cpfCnpj: string
  mobilePhone: string
  email?: string
}): Promise<AsaasCustomer> {
  // Busca pelo CPF/CNPJ primeiro
  const searchRes = await fetch(
    `${ASAAS_URL}/customers?cpfCnpj=${data.cpfCnpj}`,
    { headers: headers() }
  )
  const searchData = await searchRes.json()

  if (searchData.data?.length > 0) {
    return searchData.data[0] as AsaasCustomer
  }

  // Cria novo cliente
  const createRes = await fetch(`${ASAAS_URL}/customers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: data.name,
      cpfCnpj: data.cpfCnpj,
      mobilePhone: data.mobilePhone,
      email: data.email,
      notificationDisabled: false,
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`[Asaas] Erro ao criar cliente: ${err}`)
  }

  return createRes.json() as Promise<AsaasCustomer>
}

// ─── Criar assinatura ─────────────────────────────────────
export async function createAsaasSubscription(data: {
  customerId: string
  plan: "basic" | "pro"
  userId: string       // externalReference para lookup no webhook
}): Promise<AsaasSubscription> {
  const plano = PLANOS[data.plan]

  const res = await fetch(`${ASAAS_URL}/subscriptions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "UNDEFINED", // deixa o cliente escolher PIX, boleto ou cartão
      value: plano.value,
      cycle: "MONTHLY",
      description: plano.description,
      externalReference: data.userId, // nosso user_id para lookup no webhook
      nextDueDate: new Date().toISOString().split("T")[0],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[Asaas] Erro ao criar assinatura: ${err}`)
  }

  return res.json() as Promise<AsaasSubscription>
}

// ─── Cancelar assinatura ──────────────────────────────────
export async function cancelAsaasSubscription(
  subscriptionId: string
): Promise<void> {
  const res = await fetch(`${ASAAS_URL}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[Asaas] Erro ao cancelar assinatura: ${err}`)
  }
}

// ─── Gerar link de pagamento da assinatura ────────────────
export async function getSubscriptionPaymentLink(
  subscriptionId: string
): Promise<string | null> {
  const res = await fetch(
    `${ASAAS_URL}/subscriptions/${subscriptionId}/payments`,
    { headers: headers() }
  )

  if (!res.ok) return null

  const data = await res.json()
  const firstPayment = data.data?.[0]
  return firstPayment?.invoiceUrl ?? null
}