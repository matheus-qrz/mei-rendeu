const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME!

// ─── Normalizar número de telefone ────────────────────────
// Evolution API usa formato: 5583999999999 (sem + e sem @)
export function normalizePhone(remoteJid: string): string {
  // Remove @s.whatsapp.net ou @g.us (grupos)
  return remoteJid.replace(/@.*$/, "")
}

// ─── Enviar mensagem de texto ─────────────────────────────

export async function sendText(
  phone: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${EVOLUTION_URL}/message/sendText/${INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: phone,
          text,
          delay: 1000,  // delay humanizado de 1s
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error("[Evolution] Erro ao enviar mensagem:", err)
      return false
    }

    return true
  } catch (err) {
    console.error("[Evolution] Falha na requisição:", err)
    return false
  }
}

// ─── Enviar "digitando..." antes da resposta ──────────────
export async function sendTyping(
  phone: string,
  durationMs = 2000
): Promise<void> {
  try {
    await fetch(
      `${EVOLUTION_URL}/chat/sendPresence/${INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: phone,
          options: { presence: "composing", delay: durationMs },
        }),
      }
    )
  } catch {
    // Falha silenciosa — não crítico
  }
}

// ─── Extrair texto da mensagem recebida ───────────────────
export function extractMessageText(
  data: EvolutionMessageData
): string | null {
  const msg = data.message
  if (!msg) return null

  // Texto direto
  if (msg.conversation) return msg.conversation

  // Legenda de imagem/documento
  if (msg.imageMessage?.caption) return msg.imageMessage.caption
  if (msg.documentMessage?.caption) return msg.documentMessage.caption

  // Áudio — por ora retorna null (futuro: Whisper transcription)
  if (msg.audioMessage) return "[áudio]"

  return null
}

// ─── Types locais para o payload do Evolution ─────────────
interface EvolutionMessageData {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string
    imageMessage?: { caption?: string; url?: string }
    audioMessage?: { url?: string }
    documentMessage?: { url?: string; caption?: string }
  }
  pushName?: string
  messageType?: string
}

export type { EvolutionMessageData }
