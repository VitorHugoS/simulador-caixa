'use client'

import { useRef, useState } from 'react'
import { AppState, EventoAporte, MesData } from '@/lib/engine/types'
import { simular } from '@/lib/engine/simulation'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function mesesFmt(n: number): string {
  const a = Math.floor(n / 12)
  const m = n % 12
  if (a === 0) return `${m} meses`
  if (m === 0) return `${a} anos`
  return `${a}a ${m}m`
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

interface Props {
  row: MesData
  state: AppState
  onSave: (mes: number, eventos: EventoAporte[]) => void
  onClose: () => void
}

export function RowDetailModal({ row, state, onSave, onClose }: Props) {
  // Existing override for this month (if any)
  const existingOverride = state.eventos.find(
    (e) => e.mesInicio === row.mes && e.geradoPor === 'override'
  )

  // Pre-fill: from override if editing, else from current aporteExtra (recurring rules)
  const initValor = existingOverride?.valor ?? row.aporteExtra
  const initDigits = initValor > 0 ? String(Math.round(initValor)) : ''
  const initDisplay = initValor > 0
    ? Math.round(initValor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : ''

  const [valorDisplay, setValorDisplay] = useState(initDisplay)
  const [valorDigits, setValorDigits] = useState(initDigits)
  const [toast, setToast] = useState<string | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  function handleValorChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    const num = parseInt(digits, 10) || 0
    const cap = Math.floor(row.sdInicio)

    if (digits !== '' && num > cap) {
      const cappedStr = String(cap)
      setValorDigits(cappedStr)
      setValorDisplay(cap.toLocaleString('pt-BR', { maximumFractionDigits: 0 }))
      showToast(`Valor limitado ao saldo devedor (${moeda(cap)})`)
      return
    }

    setValorDigits(digits)
    setValorDisplay(digits ? num.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '')
  }

  const valorNum = parseInt(valorDigits, 10) || 0
  const isEditing = existingOverride !== undefined || row.aporteExtra > 0

  // Impact: compare base (without override) vs with new value
  const eventosBase = state.eventos.filter(
    (e) => !(e.mesInicio === row.mes && e.geradoPor === 'override')
  )
  const eventoPreview: EventoAporte = {
    id: 'preview',
    mesInicio: row.mes,
    valor: valorNum,
    efeito: 'reduzir_prazo',
    fgts: false,
    geradoPor: 'override',
  }
  const antes = simular(state.params, eventosBase)
  const depois = valorNum > 0
    ? simular(state.params, [...eventosBase, eventoPreview])
    : simular(state.params, eventosBase)
  const jurosEconomizados = antes.personalizado.totalJuros - depois.personalizado.totalJuros
  const mesesEconomizados = antes.personalizado.prazoReal - depois.personalizado.prazoReal

  function handleSave() {
    if (valorDigits === '') return
    onSave(row.mes, [{
      id: uid(),
      mesInicio: row.mes,
      valor: valorNum,
      efeito: 'reduzir_prazo',
      fgts: false,
      geradoPor: 'override',
      grupoId: uid(),
    }])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-amber-950 border border-amber-700 text-amber-300 text-sm px-4 py-2.5 rounded-xl shadow-xl whitespace-nowrap pointer-events-none">
          {toast}
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-lg">Mês {row.mes}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEditing ? 'Alterar aporte' : 'Adicionar aporte'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        {/* Parcela deste mês */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Parcela</p>
          <div className="grid grid-cols-2 gap-y-2.5">
            <div>
              <p className="text-xs text-gray-500">Juros</p>
              <p className="text-sm font-semibold text-red-400">{moeda(row.juros)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Amortização</p>
              <p className="text-sm font-semibold text-blue-400">{moeda(row.amortOrd)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Taxas</p>
              <p className="text-sm font-semibold text-amber-400">{moeda(row.taxas)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total parcela</p>
              <p className="text-sm font-semibold text-white">{moeda(row.parcela)}</p>
            </div>
            {row.correcaoMonetaria > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Correção TR</p>
                <p className="text-sm font-semibold text-orange-400">{moeda(row.correcaoMonetaria)}</p>
              </div>
            )}
            {row.aporteExtra > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Aporte atual</p>
                <p className="text-sm font-semibold text-emerald-400">{moeda(row.aporteExtra)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Aporte form */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">
            {isEditing ? 'Novo valor do aporte' : 'Valor do aporte'}
          </label>
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
            <span className="px-3 text-gray-500 text-sm border-r border-gray-700 py-2.5">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={valorDisplay}
              placeholder="5.000"
              onChange={(e) => handleValorChange(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-white text-sm outline-none placeholder-gray-600"
              autoFocus
            />
          </div>
        </div>

        {/* Impact preview */}
        {valorDigits !== '' && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <p className="text-xs text-gray-500 mb-3 font-medium">IMPACTO ESTIMADO</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Juros economizados</p>
                <p className={`text-base font-bold ${jurosEconomizados > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {moeda(Math.max(0, jurosEconomizados))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tempo economizado</p>
                <p className={`text-base font-bold ${mesesEconomizados > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {mesesEconomizados > 0 ? mesesFmt(mesesEconomizados) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-500 transition-all">
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={valorDigits === ''}
            className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium transition-all">
            {isEditing ? 'Atualizar' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
