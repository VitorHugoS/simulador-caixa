export function taxaMensal(iAnual: number): number {
  return Math.pow(1 + iAnual, 1 / 12) - 1
}

export function pmtPrice(pv: number, n: number, i: number): number {
  if (i === 0) return pv / n
  return pv * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
}

export function amortSAC(pv: number, n: number): number {
  return pv / n
}

// Recalcula PMT da Price após redução de parcela (novo saldo, meses restantes)
export function recalcPMT(sdAtual: number, mesesRestantes: number, i: number): number {
  return pmtPrice(sdAtual, mesesRestantes, i)
}
