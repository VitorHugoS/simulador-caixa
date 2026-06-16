import { Params, EventoAporte, MesData, SimOutput, SimResult } from './types'
import { taxaMensal, pmtPrice, amortSAC, recalcPMT } from './math'
import { eventosDoMes } from './events'

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

function simularSerie(params: Params, eventos: EventoAporte[]): SimOutput {
  const i = taxaMensal(params.iAnual)
  const serie: MesData[] = []

  let sd = params.pv
  let pmt = params.sistema === 'price' ? pmtPrice(params.pv, params.n, i) : 0
  let totalJuros = 0
  let totalPago = 0

  for (let m = 1; m <= params.n; m++) {
    if (sd <= 0) break

    const sdInicio = r2(sd)
    const juros = r2(sdInicio * i)
    const amortOrdBase =
      params.sistema === 'sac'
        ? r2(amortSAC(params.pv, params.n))
        : r2(pmt - juros)

    const eventosM = eventosDoMes(eventos, m)
    const isAutoFgtsMonth =
      params.fgtsDeposito > 0 &&
      params.fgtsFrequencia > 0 &&
      m % params.fgtsFrequencia === 0
    let aporteExtra = 0
    const overrideEv = eventosM.find((ev) => ev.geradoPor === 'override')
    if (overrideEv) {
      aporteExtra = overrideEv.valor
    } else {
      for (const ev of eventosM) {
        if (ev.fgts && ev.tipoFgts === 'abater_parcelas') continue
        aporteExtra += ev.valor
      }
      if (isAutoFgtsMonth) {
        aporteExtra += params.fgtsDeposito * params.fgtsFrequencia
      }
    }

    // Cap aporteExtra to remaining saldo after ordinary amortization
    const aporteExtraMax = r2(Math.max(0, sdInicio - amortOrdBase))
    aporteExtra = r2(Math.min(aporteExtra, aporteExtraMax))

    const amortTotal = r2(amortOrdBase + aporteExtra)
    const sdFim = r2(Math.max(0, sdInicio - amortTotal))

    const mip = r2(sdInicio * params.mipRate)
    const taxasTotal = r2(params.taxasFixas + mip)

    const parcelaBase =
      params.sistema === 'sac' ? r2(juros + amortOrdBase) : r2(pmt)

    serie.push({
      mes: m,
      sdInicio,
      juros,
      amortOrd: amortOrdBase,
      aporteExtra,
      taxas: taxasTotal,
      parcela: r2(parcelaBase + taxasTotal),
      sdFim,
      temEvento: eventosM.length > 0 || isAutoFgtsMonth,
    })

    totalJuros += juros
    totalPago += parcelaBase + taxasTotal + aporteExtra

    // Recalcular PMT na Price se efeito for reduzir_parcela
    for (const ev of eventosM) {
      if (ev.efeito === 'reduzir_parcela' && params.sistema === 'price') {
        const mesesRestantes = params.n - m
        if (mesesRestantes > 0) {
          pmt = recalcPMT(sdFim, mesesRestantes, i)
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

export function simular(params: Params, eventos: EventoAporte[]): SimResult {
  // Baselines: sem FGTS automático e sem eventos manuais
  const baseline: Params = { ...params, fgtsDeposito: 0 }

  return {
    pricePura: simularSerie({ ...baseline, sistema: 'price' }, []),
    sacPura: simularSerie({ ...baseline, sistema: 'sac' }, []),
    personalizado: simularSerie(params, eventos),
  }
}
