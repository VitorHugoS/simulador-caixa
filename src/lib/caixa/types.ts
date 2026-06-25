import type { Params } from '../engine/types'

export interface CaixaProduto {
  codigo: string
  versao: string
  descricao?: string
  nome?: string
  nomeProduto?: string
}

export interface CaixaSeguro {
  codigo: string
  descricao: string
  valor: string
}

export interface CaixaPrestacao {
  numero?: string
  valor?: string
  valorAmortizacao?: string
  valorJuros?: string
  valorTaxaAdm?: string
  valorEncargo?: string
  valorSaldoDevedor?: string
  seguros?: { seguro: CaixaSeguro[] }
}

export interface CaixaSeguradora {
  codigo?: string
  nome?: string
  valorPrimeiraPrestacao?: string
  // prestacao can be a single object or an array depending on prazo/produto
  prestacoes?: { prestacao: CaixaPrestacao | CaixaPrestacao[] } | null
}

export interface CaixaSistemaAmortizacao {
  codigo: string
  descricao: string
  utilizadoNesteCalculo: string
}

export interface CaixaSimulacaoData {
  valorFinanciamento?: string
  jurosEfetivos?: string
  jurosNominais?: string
  prazoDesejavel?: string
  prazoMaximo?: string
  valorEntrada?: string
  cotaMaximaFinanciamento?: string
  seguradoras?: { seguradora: CaixaSeguradora[] }
  sistemasAmortizacao?: { sistemaAmortizacao: CaixaSistemaAmortizacao[] }
}

export interface CaixaUF {
  coIbge: number
  sgUf: string
  noUf: string
}

export interface CaixaMunicipio {
  codigo: number
  nome: string
  sgUf: string
}

export interface CaixaExtracted {
  params: Partial<Params>
  raw: {
    pv?: string
    valorEntrada?: string
    n?: string
    iAnual?: string
    sistema?: string
    mipRate?: string
    taxasFixas?: string
  }
  warnings: string[]
}

export interface CaixaApiInput {
  renda: number
  valorImovel: number
  valorEntrada: number
  prazo: number
  sistema: 'sac' | 'price'
  dataNascimento: string   // DD/MM/YYYY
  ufImovel: number         // coIbge da UF selecionada
  municipioImovel: number  // codigo do município selecionado
  tipoFinanciamento: string  // '1' Residencial | '2' Comercial | '5' Rural
  categoriaImovel: string    // '1' Novo | '4' Usado | '6' Terreno | etc.
}
