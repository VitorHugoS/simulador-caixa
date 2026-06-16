import { EventoAporte, Params } from './types'
import { taxaMensal, pmtPrice, amortSAC } from './math'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function expandirRegra(regra: EventoAporte): number[] {
  const meses: number[] = []
  const fim = regra.mesFim ?? 360
  const freq = regra.frequencia ?? 1

  for (let m = regra.mesInicio; m <= fim; m += freq) {
    meses.push(m)
  }
  return meses
}

// Gera aportes variáveis para transformar Price em SAC exato
export function gerarSACTransform(params: Params): EventoAporte[] {
  const i = taxaMensal(params.iAnual)
  const pmt = pmtPrice(params.pv, params.n, i)
  const amortSacFixo = amortSAC(params.pv, params.n)
  const grupoId = uid()
  const eventos: EventoAporte[] = []

  let sd = params.pv
  for (let m = 1; m <= params.n; m++) {
    const juros = sd * i
    const amortPrice = pmt - juros
    const diferenca = amortSacFixo - amortPrice

    if (diferenca <= 0.01) break

    eventos.push({
      id: uid(),
      mesInicio: m,
      valor: diferenca,
      efeito: 'reduzir_prazo',
      fgts: false,
      geradoPor: 'sac-transform',
      grupoId,
    })

    sd = Math.max(0, sd - amortSacFixo)
  }

  return eventos
}

// Resolve quais eventos se aplicam a um mês específico
export function eventosDoMes(eventos: EventoAporte[], mes: number): EventoAporte[] {
  return eventos.filter((e) => {
    if (e.frequencia) {
      const fim = e.mesFim ?? 360
      if (mes < e.mesInicio || mes > fim) return false
      return (mes - e.mesInicio) % e.frequencia === 0
    }
    return e.mesInicio === mes
  })
}
