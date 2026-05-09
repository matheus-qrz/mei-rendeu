// src/lib/contratos/prestacao-servico.ts
// Portado de packages/core/src/templates/prestacao-servico.ts

import type { ContratoInput, CamposPrestacaoServico, Parte } from "@/types/contrato"

function qualificacao(parte: Parte, titulo: "CONTRATANTE" | "CONTRATADO"): string {
  if (parte.razaoSocial) {
    return `${parte.razaoSocial.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${parte.cpfCnpj}, com sede na ${parte.endereco}, ${parte.cidade}/${parte.estado}, neste ato representada por ${parte.representante}, ${parte.cargo}, doravante denominada "${titulo}";`
  }
  return `${parte.nome.toUpperCase()}, brasileiro(a), inscrito(a) no CPF sob o nº ${parte.cpfCnpj}, residente e domiciliado(a) na ${parte.endereco}, ${parte.cidade}/${parte.estado}, e-mail: ${parte.email}, doravante denominado(a) "${titulo}";`
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatDataExtenso(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatData(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("pt-BR")
}

// Número por extenso para valores simples (até 999.999)
function numeroExtenso(n: number): string {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
  const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos"]

  if (n === 0) return "zero"
  if (n === 100) return "cem"

  let resultado = ""
  const milhar = Math.floor(n / 1000)
  const resto = n % 1000
  const centena = Math.floor(resto / 100)
  const dezena = Math.floor((resto % 100) / 10)
  const unidade = resto % 10

  if (milhar > 0) resultado += (milhar === 1 ? "mil" : numeroExtenso(milhar) + " mil")
  if (centena > 0) resultado += (resultado ? " e " : "") + centenas[centena]
  if (dezena > 0) resultado += (resultado ? " e " : "") + dezenas[dezena]
  if (unidade > 0) resultado += (resultado ? " e " : "") + unidades[unidade]

  return resultado
}

function formatBRLExtenso(value: number): string {
  const reais = Math.floor(value)
  const centavos = Math.round((value - reais) * 100)

  let texto = `${formatBRL(value)} (${numeroExtenso(reais)} reais`
  if (centavos > 0) texto += ` e ${numeroExtenso(centavos)} centavos`
  texto += ")"
  return texto
}

function clausulaPagamento(c: CamposPrestacaoServico): string {
  const valor = formatBRLExtenso(c.valorTotal)
  if (c.formaPagamento === "avista") {
    return `O CONTRATANTE pagará ao CONTRATADO o valor total de ${valor}, à vista, mediante transferência bancária (PIX ou TED), no prazo de até 5 (cinco) dias úteis após a entrega dos serviços.`
  }
  if (c.formaPagamento === "parcelado") {
    const parcela = formatBRLExtenso(c.valorTotal / (c.numeroParcelas ?? 1))
    return `O CONTRATANTE pagará ao CONTRATADO o valor total de ${valor}, dividido em ${c.numeroParcelas ?? 1} parcelas iguais de ${parcela}, com vencimento todo dia ${c.diaVencimento ?? 1} de cada mês, mediante transferência bancária (PIX ou TED).`
  }
  return `O CONTRATANTE pagará ao CONTRATADO o valor mensal de ${valor}, com vencimento todo dia ${c.diaVencimento ?? 1} de cada mês, mediante transferência bancária (PIX ou TED), enquanto durar a prestação dos serviços.`
}

export function gerarPrestacaoServico(
  input: ContratoInput<CamposPrestacaoServico>
): string {
  const { contratante, contratado, campos: c, dataAssinatura, localAssinatura } = input

  const prazo = c.prazoIndeterminado
    ? "por prazo indeterminado, podendo ser rescindido mediante aviso prévio de 30 (trinta) dias"
    : `pelo período de ${formatData(c.dataInicio)} a ${formatData(c.dataFim)}`

  const clausulas: string[] = []

  clausulas.push(`CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços, que se regerá pelas seguintes cláusulas e condições:

PARTES:

${qualificacao(contratante, "CONTRATANTE")}

${qualificacao(contratado, "CONTRATADO")}

CLÁUSULA 1ª — OBJETO

1.1. O presente contrato tem por objeto a prestação dos seguintes serviços pelo CONTRATADO ao CONTRATANTE:

"${c.descricaoServico}"

1.2. Os serviços serão prestados ${prazo}.

CLÁUSULA 2ª — VALOR E FORMA DE PAGAMENTO

2.1. ${clausulaPagamento(c)}

2.2. Em caso de atraso no pagamento, incidirá multa de ${c.multaAtraso}% ao mês sobre o valor em aberto, além de correção monetária pelo IPCA.

2.3. O CONTRATADO emitirá nota fiscal ou recibo referente aos serviços prestados, conforme exigência legal aplicável ao seu regime tributário.`)

  let n = 3

  if (c.incluiPropriedadeIntelectual) {
    clausulas.push(`CLÁUSULA ${n}ª — PROPRIEDADE INTELECTUAL

${n}.1. Todos os trabalhos, criações, desenvolvimentos, códigos-fonte, layouts, textos e demais obras intelectuais produzidos pelo CONTRATADO no cumprimento deste contrato serão de propriedade exclusiva do CONTRATANTE, após o pagamento integral do valor contratado.

${n}.2. O CONTRATADO cede ao CONTRATANTE, em caráter definitivo e exclusivo, todos os direitos patrimoniais de autor sobre as obras criadas no âmbito deste contrato, nos termos da Lei nº 9.610/1998.

${n}.3. O CONTRATADO poderá, salvo instrução em contrário, mencionar o trabalho realizado em seu portfólio profissional, vedada a divulgação de informações confidenciais do CONTRATANTE.`)
    n++
  }

  if (c.incluiSigiloInformacoes) {
    clausulas.push(`CLÁUSULA ${n}ª — SIGILO E CONFIDENCIALIDADE

${n}.1. As partes comprometem-se a manter em absoluto sigilo todas as informações, dados, documentos, estratégias, tecnologias e demais conteúdos classificados como confidenciais a que tiverem acesso em decorrência deste contrato.

${n}.2. A obrigação de sigilo permanece vigente pelo prazo de 2 (dois) anos após o encerramento deste contrato, salvo disposição legal em contrário.

${n}.3. O descumprimento desta cláusula sujeitará a parte infratora ao pagamento de indenização por perdas e danos, sem prejuízo das sanções penais cabíveis.`)
    n++
  }

  if (c.incluiNaoAliciamento) {
    clausulas.push(`CLÁUSULA ${n}ª — NÃO ALICIAMENTO

${n}.1. Durante a vigência deste contrato e pelo prazo de ${c.prazoNaoAliciamentoMeses} meses após seu encerramento, as partes se comprometem a não contratar, aliciar ou induzir, direta ou indiretamente, os colaboradores, empregados, prestadores de serviço ou clientes da outra parte.`)
    n++
  }

  clausulas.push(`CLÁUSULA ${n}ª — RESCISÃO

${n}.1. Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias, por escrito.

${n}.2. A rescisão imotivada pelo CONTRATANTE antes do prazo acordado implicará o pagamento ao CONTRATADO de multa equivalente a 20% (vinte por cento) do valor restante do contrato.

${n}.3. A rescisão por justa causa, em razão de descumprimento de obrigações contratuais, poderá ocorrer de forma imediata, sem pagamento de multa pela parte não culpada.

CLÁUSULA ${n + 1}ª — DISPOSIÇÕES GERAIS

${n + 1}.1. O CONTRATADO declara atuar como prestador de serviço autônomo, não havendo qualquer vínculo empregatício entre as partes, sendo de sua responsabilidade o recolhimento de todos os tributos decorrentes de sua atividade profissional.

${n + 1}.2. Este instrumento constitui o acordo integral entre as partes, substituindo quaisquer entendimentos anteriores sobre o objeto aqui contratado.

${n + 1}.3. Qualquer alteração a este contrato deverá ser realizada por escrito e assinada por ambas as partes.

CLÁUSULA ${n + 2}ª — FORO

${n + 2}.1. As partes elegem o foro da Comarca de ${c.foro} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.

${localAssinatura}, ${formatDataExtenso(dataAssinatura)}.

_______________________________________________
${contratante.nome.toUpperCase()}
CONTRATANTE
CPF/CNPJ: ${contratante.cpfCnpj}

_______________________________________________
${contratado.nome.toUpperCase()}
CONTRATADO
CPF/CNPJ: ${contratado.cpfCnpj}

_______________________________________________
TESTEMUNHA 1
Nome:
CPF:

_______________________________________________
TESTEMUNHA 2
Nome:
CPF:`)

  return clausulas.join("\n\n")
}