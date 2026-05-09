// src/lib/onboarding/flow.ts
// Máquina de estados do onboarding via WhatsApp
// Cada usuário passa por este fluxo na primeira interação

import { supabaseAdmin } from "@/lib/supabase/client"
import { sendText } from "@/lib/evolution/client"
import type { User } from "@/types"

// ─── Estados do onboarding ────────────────────────────────
export type OnboardingStep =
  | "welcome"        // mensagem inicial enviada, aguarda confirmação de nome
  | "confirm_name"   // aguarda o usuário confirmar ou corrigir o nome
  | "ask_cnpj"       // perguntou CNPJ, aguarda resposta
  | "ask_area"       // perguntou área de atuação, aguarda resposta
  | "done"           // onboarding concluído

// ─── Áreas de atuação pré-definidas ──────────────────────
const AREAS = [
  "Serviços (design, TI, consultoria...)",
  "Alimentação (delivery, marmita, confeitaria...)",
  "Beleza (cabelo, estética, manicure...)",
  "Construção (pedreiro, eletricista, pintor...)",
  "Saúde (massagem, personal, nutrição...)",
  "Comércio (loja, revenda, artesanato...)",
  "Transporte (mototaxi, frete, mudança...)",
  "Outro",
]

// ─── Mensagens do fluxo ───────────────────────────────────
const MSG = {
  welcome: (name: string) =>
    `Oi ${name}! 👋 Sou o *MeiRendeu*, seu assistente financeiro pelo WhatsApp.\n\n` +
    `Vou te ajudar a:\n` +
    `💰 Registrar receitas e despesas\n` +
    `📅 Lembrar do DAS todo mês\n` +
    `🚦 Monitorar o teto do MEI\n` +
    `📊 Resumo financeiro mensal\n\n` +
    `Tudo aqui mesmo, sem precisar de app novo!\n\n` +
    `Primeiro, como prefere ser chamado(a)? Pode confirmar o nome ou me dizer outro. 😊`,

  askCnpj:
    `Ótimo! Agora me diz seu *CNPJ* para eu poder te ajudar melhor com informações do seu MEI.\n\n` +
    `_(Se preferir pular, é só responder *pular*)_`,

  cnpjInvalid:
    `Hmm, esse CNPJ não parece válido. 🤔\n\n` +
    `Me manda os 14 números (pode ser com ou sem pontuação), ou responde *pular* para continuar sem.`,

  askArea:
    `Perfeito! Última pergunta: qual é a sua área de atuação?\n\n` +
    `1️⃣ Serviços (design, TI, consultoria)\n` +
    `2️⃣ Alimentação (delivery, marmita, confeitaria)\n` +
    `3️⃣ Beleza (cabelo, estética, manicure)\n` +
    `4️⃣ Construção (pedreiro, eletricista, pintor)\n` +
    `5️⃣ Saúde (massagem, personal, nutrição)\n` +
    `6️⃣ Comércio (loja, revenda, artesanato)\n` +
    `7️⃣ Transporte (mototaxi, frete, mudança)\n` +
    `8️⃣ Outro\n\n` +
    `Responde o número ou escreve o nome da área. 👆`,

  done: (name: string) =>
    `Tudo pronto, ${name}! 🎉\n\n` +
    `Agora é só me contar o que aconteceu no seu negócio:\n\n` +
    `💬 *"Recebi R$500 de um cliente"*\n` +
    `💬 *"Paguei R$80 de combustível"*\n` +
    `💬 *"Como tá o mês?"*\n` +
    `💬 *"Quando vence o DAS?"*\n\n` +
    `Fala comigo como você fala com um amigo — eu entendo! 😄`,
}

// ─── Valida CNPJ (formato básico) ────────────────────────
function isValidCnpj(raw: string): boolean {
  const digits = raw.replace(/\D/g, "")
  return digits.length === 14
}

function normalizeCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "")
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

// ─── Detecta área pelo número ou texto ───────────────────
function detectArea(text: string): string | null {
  const t = text.trim().toLowerCase()

  const byNumber: Record<string, string> = {
    "1": "Serviços", "2": "Alimentação", "3": "Beleza",
    "4": "Construção", "5": "Saúde", "6": "Comércio",
    "7": "Transporte", "8": "Outro",
  }

  if (byNumber[t]) return byNumber[t]

  const keywords: Record<string, string> = {
    servi: "Serviços", design: "Serviços", ti: "Serviços", consul: "Serviços",
    aliment: "Alimentação", delivery: "Alimentação", marmita: "Alimentação", confeit: "Alimentação",
    beleza: "Beleza", cabelo: "Beleza", estét: "Beleza", manicure: "Beleza",
    constru: "Construção", pedreiro: "Construção", eletric: "Construção", pintor: "Construção",
    saúde: "Saúde", saude: "Saúde", massagem: "Saúde", personal: "Saúde",
    comércio: "Comércio", comercio: "Comércio", loja: "Comércio", revenda: "Comércio",
    transport: "Transporte", mototaxi: "Transporte", frete: "Transporte",
    outro: "Outro", outros: "Outro",
  }

  for (const [key, area] of Object.entries(keywords)) {
    if (t.includes(key)) return area
  }

  // Se não reconheceu mas tem texto, aceita como área customizada
  if (text.trim().length > 2) return text.trim()

  return null
}

// ─── Busca o step atual do onboarding ────────────────────
export async function getOnboardingStep(
  userId: string
): Promise<OnboardingStep> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("onboarding_step")
    .eq("id", userId)
    .single()

  return (data?.onboarding_step as OnboardingStep) ?? "welcome"
}

// ─── Salva o step atual ───────────────────────────────────
async function saveStep(
  userId: string,
  step: OnboardingStep,
  extra?: Partial<{ name: string; cnpj: string; area: string }>
): Promise<void> {
  await supabaseAdmin
    .from("users")
    .update({ onboarding_step: step, ...extra })
    .eq("id", userId)
}

// ─── Processa uma mensagem dentro do onboarding ───────────
// Retorna true se ainda está no onboarding, false se terminou
export async function handleOnboarding(
  user: User,
  message: string,
  phone: string
): Promise<boolean> {
  const step = await getOnboardingStep(user.id)
  const text = message.trim()

  switch (step) {
    // ── Primeira mensagem: manda boas-vindas ─────────────
    case "welcome": {
      await sendText(phone, MSG.welcome(user.name))
      await saveStep(user.id, "confirm_name")
      return true
    }

    // ── Confirma ou corrige o nome ────────────────────────
    case "confirm_name": {
      // Qualquer resposta vira o nome (ex: "pode ser", "Matheus", "João")
      const newName = text.length > 1 && text.length < 50
        ? text
        : user.name

      await saveStep(user.id, "ask_cnpj", { name: newName })
      await supabaseAdmin
        .from("users")
        .update({ name: newName })
        .eq("id", user.id)

      await sendText(phone, MSG.askCnpj)
      return true
    }

    // ── Recebe CNPJ ou pula ───────────────────────────────
    case "ask_cnpj": {
      const lower = text.toLowerCase()

      if (lower === "pular" || lower === "skip" || lower === "não" || lower === "nao") {
        await saveStep(user.id, "ask_area")
        await sendText(phone, MSG.askArea)
        return true
      }

      if (isValidCnpj(text)) {
        const cnpj = normalizeCnpj(text)
        await saveStep(user.id, "ask_area", { cnpj })
        await supabaseAdmin
          .from("users")
          .update({ cnpj })
          .eq("id", user.id)

        await sendText(phone, MSG.askArea)
        return true
      }

      // CNPJ inválido — pede de novo
      await sendText(phone, MSG.cnpjInvalid)
      return true
    }

    // ── Recebe área de atuação ────────────────────────────
    case "ask_area": {
      const area = detectArea(text)

      if (!area) {
        await sendText(
          phone,
          `Não entendi bem. Responde o número (1 a 8) ou escreve sua área. 😊`
        )
        return true
      }

      // Salva área no payload do usuário (campo extra no Supabase)
      await saveStep(user.id, "done")
      await supabaseAdmin
        .from("users")
        .update({ business_area: area } as any)
        .eq("id", user.id)

      // Atualiza o nome atualizado para a mensagem final
      const { data: updatedUser } = await supabaseAdmin
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single()

      await sendText(phone, MSG.done(updatedUser?.name ?? user.name))
      return false // onboarding concluído — libera o agente
    }

    // ── Onboarding já concluído ───────────────────────────
    case "done":
    default:
      return false
  }
}