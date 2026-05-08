import { supabaseAdmin } from "./client"
import type { User, Transaction, MonthlySummary, AgentContext } from "@/types"

// ─── Users ────────────────────────────────────────────────

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single()

  if (error || !data) return null
  return data as User
}

export async function createUser(phone: string, name: string): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({ phone, name, plan: "trial" })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar usuário: ${error.message}`)
  return data as User
}

export async function upsertUser(phone: string, name: string): Promise<User> {
  const existing = await getUserByPhone(phone)
  if (existing) return existing
  return createUser(phone, name)
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<User, "name" | "cnpj" | "plan" | "stripe_customer_id" | "stripe_subscription_id">>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("users")
    .update(data)
    .eq("id", userId)

  if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`)
}

// ─── Transactions ─────────────────────────────────────────

export async function createTransaction(
  userId: string,
  data: {
    type: "income" | "expense"
    amount: number       // em centavos
    category: string
    description: string
    rawMessage?: string
  }
): Promise<Transaction> {
  const { data: tx, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      source: "whatsapp",
      raw_message: data.rawMessage ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar transação: ${error.message}`)
  return tx as Transaction
}

export async function getMonthTransactions(
  userId: string,
  year: number,
  month: number
): Promise<Transaction[]> {
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Erro ao buscar transações: ${error.message}`)
  return (data ?? []) as Transaction[]
}

// ─── Monthly Summary ──────────────────────────────────────

export async function getMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<MonthlySummary | null> {
  const { data, error } = await supabaseAdmin
    .from("monthly_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .single()

  if (error || !data) return null
  return data as MonthlySummary
}

// ─── Agent Context ────────────────────────────────────────
// Tudo que o Claude precisa saber numa query só

export async function getAgentContext(phone: string): Promise<AgentContext | null> {
  const user = await getUserByPhone(phone)
  if (!user) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const summary = await getMonthlySummary(user.id, year, month)

  return {
    user,
    currentMonth: {
      income: summary?.total_income ?? 0,
      expense: summary?.total_expense ?? 0,
      dasEstimate: summary?.das_estimate ?? 0,
      transactionCount: 0,
    },
    ytdRevenue: user.monthly_revenue_ytd,
  }
}

// ─── Message Logs ─────────────────────────────────────────

export async function logMessage(data: {
  userId: string | null
  direction: "inbound" | "outbound"
  content: string
  tokensUsed?: number
  model?: string
}): Promise<void> {
  await supabaseAdmin.from("message_logs").insert({
    user_id: data.userId,
    direction: data.direction,
    content: data.content,
    tokens_used: data.tokensUsed ?? null,
    model: data.model ?? null,
  })
}
