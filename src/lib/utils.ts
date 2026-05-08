// ─── Moeda ────────────────────────────────────────────────

// Converte centavos para string formatada: 15000 → "R$150,00"
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

// Converte string brasileira para centavos: "R$ 1.500,00" → 150000
export function parseCurrencyToCents(value: string): number | null {
  // Remove tudo exceto dígitos e vírgula/ponto
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")        // remove separador de milhar
    .replace(",", ".")          // vírgula decimal → ponto

  const num = parseFloat(cleaned)
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

// ─── Datas ────────────────────────────────────────────────

export function getCurrentMonthName(): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date())
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// Dias até o DAS (vence dia 20)
export function getDaysUntilDAS(): number {
  const now = new Date()
  const das = new Date(now.getFullYear(), now.getMonth(), 20)
  if (das < now) {
    // DAS do próximo mês
    das.setMonth(das.getMonth() + 1)
  }
  return Math.ceil((das.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Telefone ─────────────────────────────────────────────

// Valida número brasileiro: 55 + DDD (2d) + número (8-9d)
export function isValidBrazilianPhone(phone: string): boolean {
  return /^55\d{10,11}$/.test(phone)
}

// ─── Texto ────────────────────────────────────────────────

// Remove menções a valores monetários para log (LGPD)
export function sanitizeForLog(text: string): string {
  return text
    .replace(/R\$\s?[\d.,]+/g, "R$***")
    .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, "***.**.***.***-**")  // CPF
    .replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, "**.**.***/****-**")  // CNPJ
}
