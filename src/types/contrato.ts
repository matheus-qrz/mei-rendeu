// src/types/contrato.ts
// Portado de packages/core/src/types/contrato.ts do freelancer-br

export type TipoContrato =
  | "prestacao-servico"
  | "nda"
  | "parceria-comercial"
  | "locacao"

export interface Parte {
  nome: string
  cpfCnpj: string
  endereco: string
  cidade: string
  estado: string
  email: string
  razaoSocial?: string
  representante?: string
  cargo?: string
}

export interface CamposPrestacaoServico {
  descricaoServico: string
  dataInicio: string
  dataFim: string
  prazoIndeterminado: boolean
  valorTotal: number
  formaPagamento: "avista" | "parcelado" | "recorrente"
  numeroParcelas?: number
  diaVencimento?: number
  multaAtraso: number
  incluiPropriedadeIntelectual: boolean
  incluiSigiloInformacoes: boolean
  incluiNaoAliciamento: boolean
  prazoNaoAliciamentoMeses: number
  foro: string
}

export interface ContratoInput<T = unknown> {
  tipo: TipoContrato
  contratante: Parte
  contratado: Parte
  campos: T
  dataAssinatura: string
  localAssinatura: string
}