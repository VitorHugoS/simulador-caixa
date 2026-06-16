'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SimResult } from '@/lib/engine/types'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Props {
  result: SimResult
  hasEvents: boolean
}

const SERIES = [
  { key: 'price', label: 'Price', color: '#ef4444' },
  { key: 'sac', label: 'SAC', color: '#3b82f6' },
  { key: 'personalizado', label: 'Personalizado', color: '#10b981' },
] as const

type SerieKey = typeof SERIES[number]['key']

export function BalanceChart({ result, hasEvents }: Props) {
  const [visible, setVisible] = useState<Record<SerieKey, boolean>>({
    price: true, sac: true, personalizado: hasEvents,
  })

  useEffect(() => {
    setVisible((prev) => ({ ...prev, personalizado: hasEvents }))
  }, [hasEvents])

  const maxLen = Math.max(
    result.pricePura.serie.length,
    result.sacPura.serie.length,
    result.personalizado.serie.length,
  )

  const data = Array.from({ length: maxLen }, (_, idx) => ({
    mes: idx + 1,
    price: result.pricePura.serie[idx]?.sdFim ?? null,
    sac: result.sacPura.serie[idx]?.sdFim ?? null,
    personalizado: result.personalizado.serie[idx]?.sdFim ?? null,
  }))

  function toggle(key: SerieKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-semibold text-sm">Evolução do saldo devedor</h3>
        <div className="flex gap-2 flex-wrap">
          {SERIES.map((s) => (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-all ${
                visible[s.key]
                  ? 'border-transparent text-white'
                  : 'border-gray-700 text-gray-600'
              }`}
              style={visible[s.key] ? { backgroundColor: s.color + '22', borderColor: s.color + '66' } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: visible[s.key] ? s.color : '#4b5563' }}
              />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v) => `${v}m`}
            interval={59}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={45}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            formatter={(value, name) => {
              const s = SERIES.find((x) => x.key === String(name ?? ''))
              return [moeda(Number(value ?? 0)), s?.label ?? String(name ?? '')]
            }}
            labelFormatter={(v) => `Mês ${v}`}
          />
          {SERIES.map((s) =>
            visible[s.key] ? (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                dot={false}
                strokeWidth={2}
                connectNulls={false}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
