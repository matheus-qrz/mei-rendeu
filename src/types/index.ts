// ─── Database Types (gerado pelo Supabase CLI, mas tipado manualmente aqui) ───

export type Plan = "trial" | "basic" | "pro"
export type TransactionType = "income" | "expense"
export type AlertType = "das_reminder" | "mei_limit" | "monthly_summary" | "low_balance"

// ─── Tabelas ──────────────────────────────────────────────────────────────────

export interface User {
  id: string
  phone: string           // formato: 5583999999999 (DDI + DDD + número)
  name: string
  cnpj: string | null
  plan: Plan
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  monthly_revenue_ytd: number  // receita acumulada no ano (controle teto MEI)
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number          // em centavos (evitar float)
  category: string
  description: string
  source: "whatsapp" | "dashboard"
  raw_message: string | null
  created_at: string
}

export interface MonthlySummary {
  id: string
  user_id: string
  year: number
  month: number           // 1-12
  total_income: number    // centavos
  total_expense: number   // centavos
  das_estimate: number    // centavos
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  user_id: string
  type: AlertType
  scheduled_at: string
  sent_at: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface MessageLog {
  id: string
  user_id: string
  direction: "inbound" | "outbound"
  content: string
  tokens_used: number | null
  model: string | null
  created_at: string
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface AgentContext {
  user: User
  currentMonth: {
    income: number
    expense: number
    dasEstimate: number
    transactionCount: number
  }
  ytdRevenue: number      // para controle do teto MEI
}

export interface ParsedIntent {
  action:
    | "register_income"
    | "register_expense"
    | "query_balance"
    | "query_history"
    | "das_info"
    | "mei_limit_info"
    | "unknown"
  amount?: number
  category?: string
  description?: string
  rawText: string
}

export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string   // ex: "5583999999999@s.whatsapp.net"
      fromMe: boolean
      id: string
    }
    message: {
      conversation?: string
      imageMessage?: { caption?: string; url?: string }
      audioMessage?: { url?: string }
      documentMessage?: { url?: string; caption?: string }
    }
    messageType: "conversation" | "imageMessage" | "audioMessage" | "documentMessage"
    pushName: string
  }
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}
