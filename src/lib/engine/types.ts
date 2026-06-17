export type Sistema = 'price' | 'sac'
export type EfeitoAporte = 'reduzir_prazo' | 'reduzir_parcela'
export type ModoEntrada = 'proposta' | 'simular'

export interface Params {
  pv: number
  n: number
  iAnual: number
  taxasFixas: number         // DFI + taxa de administração (valor fixo mensal)
  mipRate: number            // MIP como % mensal do saldo devedor (ex: 0.0001159)
  sistema: Sistema
  fgtsDeposito: number
  fgtsFrequencia: number
}

export interface EventoAporte {
  id: string
  mesInicio: number
  mesFim?: number
  frequencia?: number
  valor: number
  efeito: EfeitoAporte
  fgts: boolean
  geradoPor: 'lote' | 'sac-transform' | 'override'
  grupoId?: string
}

export interface MesData {
  mes: number
  sdInicio: number
  juros: number
  amortOrd: number
  aporteExtra: number
  taxas: number
  parcela: number
  sdFim: number
  temEvento: boolean
}

export interface SimOutput {
  serie: MesData[]
  prazoReal: number
  totalJuros: number
  totalPago: number
}

export interface SimResult {
  pricePura: SimOutput
  sacPura: SimOutput
  personalizado: SimOutput
}

export interface AppState {
  modo: ModoEntrada
  params: Params
  eventos: EventoAporte[]
}

export const DEFAULTS_SIMULAR: Params = {
  pv: 300000,
  n: 360,
  iAnual: 0.1149,
  taxasFixas: 60,
  mipRate: 0.00021,
  sistema: 'sac',
  fgtsDeposito: 0,
  fgtsFrequencia: 24,
}
