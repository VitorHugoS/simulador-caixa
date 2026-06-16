'use client'

import { SimResult, Sistema } from '@/lib/engine/types'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function meses(n: number): string {
  const anos = Math.floor(n / 12)
  const m = n % 12
  if (anos === 0) return `${m}m`
  if (m === 0) return `${anos}a`
  return `${anos}a ${m}m`
}

interface Props {
  result: SimResult
  hasEvents: boolean
  sistema: Sistema
}

export function KPICards({ result, hasEvents, sistema }: Props) {
  const { personalizado, pricePura, sacPura } = result
  const baseline = sistema === 'price' ? pricePura : sacPura
  const baselineLabel = sistema === 'price' ? 'Price' : 'SAC'

  const jurosEconomizados = baseline.totalJuros - personalizado.totalJuros
  const mesesEconomizados = baseline.prazoReal - personalizado.prazoReal

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-1">Prazo real de quitação</p>
        <p className="text-2xl font-bold text-white">{meses(personalizado.prazoReal)}</p>
        {hasEvents && mesesEconomizados > 0 && (
          <p className="text-xs text-emerald-400 mt-1">
            {meses(mesesEconomizados)} a menos que a {baselineLabel}
          </p>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-1">Juros economizados</p>
        <p className={`text-2xl font-bold ${hasEvents && jurosEconomizados > 0 ? 'text-emerald-400' : 'text-white'}`}>
          {moeda(hasEvents ? Math.max(0, jurosEconomizados) : 0)}
        </p>
        {hasEvents && (
          <p className="text-xs text-gray-600 mt-1">
            vs {baselineLabel} ({moeda(baseline.totalJuros)} total)
          </p>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-1">Custo total do imóvel</p>
        <p className="text-2xl font-bold text-white">{moeda(personalizado.totalPago)}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-gray-600">SAC: {moeda(sacPura.totalPago)}</span>
          <span className="text-xs text-gray-600">Price: {moeda(pricePura.totalPago)}</span>
          {hasEvents && (
            <span className="text-xs text-gray-600">sem aportes: {moeda(baseline.totalPago)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
