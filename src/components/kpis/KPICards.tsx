'use client'

import { SimResult } from '@/lib/engine/types'
import { TrendingDownIcon, TrendingUpIcon, CheckIcon } from '@/components/ui/icons'

function moeda(n: number): string {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}k`
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
  sistema: import('@/lib/engine/types').Sistema
  prazoContratado: number
}

interface RowConfig {
  label: string
  values: [number, number, number]
  format: (n: number) => string
  /** Se true, o maior valor é o melhor (ex: economia de prazo). Padrão: false (menor = melhor) */
  higherIsBetter?: boolean
  /** Se true, não destaca winner quando todos os valores forem 0 */
  skipIfAllZero?: boolean
}

function DeltaBadge({ pct, up = false }: { pct: number; up?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 font-medium whitespace-nowrap">
      {up
        ? <TrendingUpIcon className="w-3 h-3" />
        : <TrendingDownIcon className="w-3 h-3" />
      }
      {pct.toFixed(0)}%
    </span>
  )
}

function WinnerCheck() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500/15 border border-green-500/30">
      <CheckIcon className="w-2.5 h-2.5 text-green-400" />
    </span>
  )
}

export function KPICards({ result, hasEvents, prazoContratado }: Props) {
  const { personalizado, pricePura, sacPura } = result

  // Economia de prazo = prazo contratado − prazo real (meses economizados)
  const economiaSac   = prazoContratado - sacPura.prazoReal
  const economiaPrice = prazoContratado - pricePura.prazoReal
  const economiaPerso = prazoContratado - personalizado.prazoReal

  const rows: RowConfig[] = [
    {
      label: 'Juros totais',
      values: [sacPura.totalJuros, pricePura.totalJuros, personalizado.totalJuros],
      format: moeda,
    },
    {
      label: 'Custo total',
      values: [sacPura.totalPago, pricePura.totalPago, personalizado.totalPago],
      format: moeda,
    },
    {
      label: 'Prazo real',
      values: [sacPura.prazoReal, pricePura.prazoReal, personalizado.prazoReal],
      format: meses,
    },
    {
      label: 'Economia de prazo',
      values: [economiaSac, economiaPrice, economiaPerso],
      format: (n: number) => n > 0 ? meses(n) : '—',
      higherIsBetter: true,
      skipIfAllZero: true,
    },
  ]

  const cols = [
    { key: 'sac',          label: 'SAC',           color: 'text-blue-400' },
    { key: 'price',        label: 'PRICE',          color: 'text-orange-400' },
    { key: 'personalizado',label: 'Personalizado',  color: 'text-white' },
  ]

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] border-b border-gray-800">
        <div className="px-4 py-3" />
        {cols.map((col) => (
          <div key={col.key} className="px-3 py-3 text-center">
            <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, ri) => {
        const allZero = row.values.every((v) => v === 0)
        const skipWinner = row.skipIfAllZero && allZero

        // Para "maior é melhor", winner = maxVal; senão winner = minVal
        const bestVal = row.higherIsBetter
          ? Math.max(...row.values)
          : Math.min(...row.values)

        // Segunda melhor referência para calcular % de diferença
        const sorted = [...row.values].sort((a, b) => row.higherIsBetter ? b - a : a - b)
        const secondBest = sorted[1]

        return (
          <div
            key={row.label}
            className={`grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] ${ri < rows.length - 1 ? 'border-b border-gray-800' : ''}`}
          >
            {/* Métrica label */}
            <div className="px-4 py-4 flex items-center">
              <span className="text-xs text-gray-500 font-medium">{row.label}</span>
            </div>

            {/* Valores */}
            {row.values.map((val, ci) => {
              const isWinner = !skipWinner && val === bestVal
              const pct = row.higherIsBetter
                ? (secondBest > 0 ? ((bestVal - secondBest) / secondBest) * 100 : 0)
                : (secondBest > 0 ? ((secondBest - bestVal) / secondBest) * 100 : 0)
              const showBadge = isWinner && hasEvents && pct > 0.5

              return (
                <div
                  key={ci}
                  className={`px-3 py-4 flex flex-col items-center justify-center gap-1.5 transition-colors ${
                    isWinner && hasEvents
                      ? 'bg-green-500/5 border-l border-r border-green-500/10'
                      : 'border-l border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isWinner && hasEvents && <WinnerCheck />}
                    <span className={`text-sm font-semibold tabular-nums ${
                      isWinner && hasEvents ? 'text-white' : 'text-gray-400'
                    }`}>
                      {row.format(val)}
                    </span>
                  </div>
                  {showBadge && <DeltaBadge pct={pct} up={row.higherIsBetter} />}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
