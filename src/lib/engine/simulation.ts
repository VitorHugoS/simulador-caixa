import { Params, EventoAporte, MesData, SimOutput, SimResult, AportesPlanejadosMap } from './types'
import { taxaMensal, pmtPrice, amortSAC, recalcPMT } from './math'
import { resolverAportes } from './events'

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

function simularSerie(params: Params, aportesPlanejados: AportesPlanejadosMap): SimOutput {
  const i = taxaMensal(params.iAnual)
  const trMensal = params.trAnual > 0 ? Math.pow(1 + params.trAnual, 1 / 12) - 1 : 0
  const serie: MesData[] = []

  let sd = params.pv
  let pmt = params.sistema === 'price' ? pmtPrice(params.pv, params.n, i) : 0
  let amortSacMutavel = params.sistema === 'sac' ? r2(amortSAC(params.pv, params.n)) : 0
  let totalJuros = 0
  let totalPago = 0

  for (let m = 1; m <= params.n; m++) {
    if (sd <= 0) break

    // Apply monthly monetary correction (TR) to the balance before any calculation
    const correcaoMonetaria = trMensal > 0 ? r2(sd * trMensal) : 0
    if (trMensal > 0) sd = r2(sd + correcaoMonetaria)

    // PRICE + TR (prazo fixo): recalculate PMT on the corrected balance each period
    if (params.sistema === 'price' && trMensal > 0) {
      pmt = recalcPMT(sd, params.n - m + 1, i)
    }

    const sdInicio = r2(sd)
    const juros = r2(sdInicio * i)
    const amortOrdBase =
      params.sistema === 'sac'
        ? amortSacMutavel
        : r2(pmt - juros)

    const aporte = aportesPlanejados[m]
    let aporteExtra = 0
    let efeito = null

    if (aporte) {
      const aporteExtraMax = r2(Math.max(0, sdInicio - amortOrdBase))
      aporteExtra = r2(Math.min(aporte.valorAcumulado, aporteExtraMax))
      efeito = aporte.efeitoFinal
    }

    const amortTotal = r2(amortOrdBase + aporteExtra)
    const sdFim = r2(Math.max(0, sdInicio - amortTotal))

    const mip = r2(sdInicio * params.mipRate)
    const taxasTotal = r2(params.taxasFixas + mip)

    const parcelaBase =
      params.sistema === 'sac' ? r2(juros + amortOrdBase) : r2(pmt)

    serie.push({
      mes: m,
      sdInicio,
      correcaoMonetaria,
      juros,
      amortOrd: amortOrdBase,
      aporteExtra,
      taxas: taxasTotal,
      parcela: r2(parcelaBase + taxasTotal),
      sdFim,
      temEvento: !!aporte,
    })

    totalJuros += juros
    totalPago += parcelaBase + taxasTotal + aporteExtra

    // Recalcular amortização se efeito for reduzir_parcela
    if (efeito === 'reduzir_parcela') {
      const mesesRestantes = params.n - m
      if (mesesRestantes > 0) {
        if (params.sistema === 'price') {
          pmt = recalcPMT(sdFim, mesesRestantes, i)
        } else {
          amortSacMutavel = r2(sdFim / mesesRestantes)
        }
      }
    }

    sd = sdFim
  }

  return {
    serie,
    prazoReal: serie.length,
    totalJuros: r2(totalJuros),
    totalPago: r2(totalPago),
  }
}

export function simularBaselines(params: Params): { pricePura: SimOutput; sacPura: SimOutput } {
  const baseline: Params = { ...params, fgtsDeposito: 0 }
  return {
    pricePura: simularSerie({ ...baseline, sistema: 'price' }, {}),
    sacPura: simularSerie({ ...baseline, sistema: 'sac' }, {}),
  }
}

export function simularPersonalizado(params: Params, eventos: EventoAporte[]): SimOutput {
  const planejados = resolverAportes(eventos, params)
  return simularSerie(params, planejados)
}

export function simular(params: Params, eventos: EventoAporte[]): SimResult {
  return {
    ...simularBaselines(params),
    personalizado: simularPersonalizado(params, eventos),
  }
}
