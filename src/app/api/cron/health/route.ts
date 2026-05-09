import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { sendText } from "@/lib/evolution/client"

// Número do fundador para receber alertas de sistema
const ADMIN_PHONE = process.env.ADMIN_PHONE!

// Limites de alerta (free tier = 500MB)
const THRESHOLD_WARN_MB = 400   // 80% — aviso amarelo
const THRESHOLD_CRIT_MB = 475   // 95% — alerta crítico

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Valida secret para evitar chamadas não autorizadas
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const results = await Promise.allSettled([
      checkDatabaseSize(),
      checkActiveUsers(),
      checkMessageVolume(),
    ])

    const [dbSize, activeUsers, messageVolume] = results

    const report: Record<string, unknown> = {}
    const alerts: string[] = []

    // ─── Tamanho do banco ──────────────────────────────
    if (dbSize.status === "fulfilled") {
      const { sizeMB, tableCount } = dbSize.value
      report.database = { sizeMB, tableCount }

      if (sizeMB >= THRESHOLD_CRIT_MB) {
        alerts.push(
          `🚨 *CRÍTICO* — Banco em ${sizeMB}MB de 500MB (${Math.round((sizeMB / 500) * 100)}%).\n` +
          `Faça upgrade do Supabase AGORA antes de parar de funcionar.`
        )
      } else if (sizeMB >= THRESHOLD_WARN_MB) {
        alerts.push(
          `⚠️ *Aviso* — Banco em ${sizeMB}MB de 500MB (${Math.round((sizeMB / 500) * 100)}%).\n` +
          `Considere fazer upgrade do Supabase em breve.`
        )
      }
    } else {
      console.error("[Health] Erro ao checar tamanho do banco:", dbSize.reason)
    }

    // ─── Usuários ativos ───────────────────────────────
    if (activeUsers.status === "fulfilled") {
      report.users = activeUsers.value
    }

    // ─── Volume de mensagens (últimas 24h) ─────────────
    if (messageVolume.status === "fulfilled") {
      report.messages24h = messageVolume.value
    }

    // ─── Envia alertas se houver ───────────────────────
    if (alerts.length > 0 && ADMIN_PHONE) {
      const header = `🤖 *MEI Rendeu — Alerta de Sistema*\n${new Date().toLocaleDateString("pt-BR")}\n\n`
      await sendText(ADMIN_PHONE, header + alerts.join("\n\n"))
    }

    // ─── Log no banco (tabela alerts) ─────────────────
    if (alerts.length > 0) {
      await supabaseAdmin.from("alerts").insert({
        user_id: null,  // alerta de sistema, não de usuário
        type: "low_balance", // reutilizando o tipo mais próximo
        scheduled_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        payload: { report, alertCount: alerts.length, alerts },
      })
    }

    return NextResponse.json({
      ok: true,
      alertsSent: alerts.length,
      report,
      checkedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[Health] Erro inesperado:", err)
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────

async function checkDatabaseSize(): Promise<{ sizeMB: number; tableCount: number }> {
  // Query nativa do PostgreSQL para tamanho do banco
  const { data, error } = await supabaseAdmin.rpc("get_db_size")

  if (error || !data) {
    // Fallback: estima pelo número de rows
    const { count } = await supabaseAdmin
      .from("message_logs")
      .select("*", { count: "exact", head: true })

    // ~1KB por mensagem = estimativa grosseira
    const estimatedMB = Math.round(((count ?? 0) * 1024) / 1_000_000)
    return { sizeMB: estimatedMB, tableCount: 5 }
  }

  return data as { sizeMB: number; tableCount: number }
}

async function checkActiveUsers(): Promise<{
  total: number
  trial: number
  basic: number
  pro: number
}> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan")

  if (error || !data) return { total: 0, trial: 0, basic: 0, pro: 0 }

  return {
    total: data.length,
    trial: data.filter((u) => u.plan === "trial").length,
    basic: data.filter((u) => u.plan === "basic").length,
    pro: data.filter((u) => u.plan === "pro").length,
  }
}

async function checkMessageVolume(): Promise<{ count: number; tokensUsed: number }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from("message_logs")
    .select("tokens_used")
    .gte("created_at", since)

  if (error || !data) return { count: 0, tokensUsed: 0 }

  return {
    count: data.length,
    tokensUsed: data.reduce((sum, row) => sum + (row.tokens_used ?? 0), 0),
  }
}