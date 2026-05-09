// src/lib/calcular.ts
// Lógica de precificação — portada do freelancer-br

export type Regime = 'mei' | 'autonomo'

export interface Inputs {
  regime: Regime
  rendaLiquida: number       // R$ líquido desejado/mês
  horasPorSemana: number
  semanasFeriasPorAno: number
  despesasMensais: number    // overhead mensal
  inadimplenciaPct: number   // ex: 0.10 = 10%
  margemLucroPct: number     // ex: 0.20 = 20%
}

export interface Resultado {
  custoHora: number
  valorProjeto40h: number
  valorRetainerMensal: number
  breakdown: {
    rendaBruta: number
    impostos: number
    inss: number
    ferias13: number
    despesas: number
    inadimplencia: number
    lucro: number
  }
  sugestoes: {
    minimo: number
    ideal: number
    premium: number
  }
  alertaTeto: boolean        // faturamento projetado > 80% do teto MEI
}

const MEI_TETO_ANUAL = 81_000
const SALARIO_MINIMO_2026 = 1_518  // atualizar anualmente

export function calcular(inputs: Inputs): Resultado {
  const {
    regime,
    rendaLiquida,
    horasPorSemana,
    semanasFeriasPorAno,
    despesasMensais,
    inadimplenciaPct,
    margemLucroPct,
  } = inputs

  // ─── Horas úteis por mês (descontando férias) ─────────────
  const semanasTrabalhadasAno = 52 - semanasFeriasPorAno
  const horasMensaisEfetivas = (horasPorSemana * semanasTrabalhadasAno) / 12

  // ─── Impostos por regime ──────────────────────────────────
  // MEI: DAS fixo ~R$67/mês (INSS + ISS ou ICMS)
  // Autônomo PF: INSS 20% sobre salário mínimo + IRPF progressivo estimado
  let impostosMensais: number
  let inssContribuicao: number

  if (regime === 'mei') {
    // DAS MEI 2026 (serviços): R$67,90 fixo
    inssContribuicao = 67.9
    impostosMensais = inssContribuicao
  } else {
    // Autônomo PF — INSS 20% sobre salário mínimo
    inssContribuicao = SALARIO_MINIMO_2026 * 0.20
    // IRPF: estimativa simplificada na alíquota de 15% (faixa intermediária)
    const irpfEstimado = rendaLiquida * 0.15
    impostosMensais = inssContribuicao + irpfEstimado
  }

  // ─── Provisão férias + 13º (rateado mensalmente) ─────────
  // Férias = 1/12 por mês = 8.33%
  // 13º = 1/12 por mês = 8.33%
  const ferias13Mensal = rendaLiquida * (1 / 12 + 1 / 12)

  // ─── Custo total mensal ───────────────────────────────────
  const custoBase =
    rendaLiquida +
    impostosMensais +
    ferias13Mensal +
    despesasMensais

  // ─── Ajuste por inadimplência e margem de lucro ───────────
  // Gross-up: preço = custo / (1 - pct)
  const fatorInadimplencia = 1 / (1 - inadimplenciaPct)
  const fatorMargem = 1 / (1 - margemLucroPct)
  const faturamentoNecessario = custoBase * fatorInadimplencia * fatorMargem

  // ─── Custo hora ───────────────────────────────────────────
  const custoHora = faturamentoNecessario / horasMensaisEfetivas

  // ─── Sugestões de cobrança ────────────────────────────────
  const sugestoes = {
    minimo: custoHora,
    ideal: custoHora * 1.3,
    premium: custoHora * 1.7,
  }

  // ─── Alerta de teto MEI ───────────────────────────────────
  const faturamentoAnualProjetado = faturamentoNecessario * 12
  const alertaTeto =
    regime === 'mei' &&
    faturamentoAnualProjetado > MEI_TETO_ANUAL * 0.8

  return {
    custoHora,
    valorProjeto40h: custoHora * 40,
    valorRetainerMensal: faturamentoNecessario,
    breakdown: {
      rendaBruta: rendaLiquida,
      impostos: impostosMensais,
      inss: inssContribuicao,
      ferias13: ferias13Mensal,
      despesas: despesasMensais,
      inadimplencia: custoBase * inadimplenciaPct,
      lucro: faturamentoNecessario * margemLucroPct,
    },
    sugestoes,
    alertaTeto,
  }
}