'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { SimResult } from '@/lib/engine/types'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Props {
  result: SimResult
}

export function PaymentChart({ result }: Props) {
  // Usar série personalizado; amostrar a cada 12 meses para não poluir
  const serie = result.personalizado.serie.filter((_, i) => i % 12 === 0)

  const data = serie.map((m) => ({
    mes: m.mes,
    Juros: m.juros,
    Amortização: m.amortOrd,
    Taxas: m.taxas,
    Aporte: m.aporteExtra,
  }))

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
      <h3 className="text-white font-semibold text-sm mb-4">
        Composição da parcela ao longo do tempo
      </h3>
      <p className="text-xs text-gray-500 mb-3">Anual — cenário personalizado</p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v) => `${v}m`}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            formatter={(v, name) => [moeda(Number(v ?? 0)), String(name ?? '')]}
            labelFormatter={(v) => `Mês ${v}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
          />
          <Bar dataKey="Juros" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Taxas" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Amortização" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Aporte" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
