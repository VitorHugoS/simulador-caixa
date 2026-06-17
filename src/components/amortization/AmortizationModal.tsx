'use client'

import { useRef, useState } from 'react'
import { AppState, EventoAporte, EfeitoAporte } from '@/lib/engine/types'
import { simular } from '@/lib/engine/simulation'
import { gerarSACTransform } from '@/lib/engine/events'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function meses(n: number): string {
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
  state: AppState
  onApply: (eventos: EventoAporte[]) => void
  onClose: () => void
  isSACTransform?: boolean
}

export function AmortizationModal({ state, onApply, onClose, isSACTransform = false }: Props) {
  const { fgtsDeposito, fgtsFrequencia } = state.params
  const fgtsAcumulado = fgtsDeposito * fgtsFrequencia

  const [mesInicio, setMesInicio] = useState('1')
  const [mesFim, setMesFim] = useState('')
  const [frequencia, setFrequencia] = useState('1')
  const [valor, setValor] = useState('')
  const [efeito, setEfeito] = useState<EfeitoAporte>('reduzir_prazo')
  const [toast, setToast] = useState<string | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }
  const [fgts, setFgts] = useState(false)

  function toggleFgts() {
    const next = !fgts
    setFgts(next)
    if (next && fgtsAcumulado > 0) {
      setValor(String(fgtsAcumulado))
      setFrequencia(String(fgtsFrequencia))
    }
  }

  const novosEventos: EventoAporte[] = isSACTransform
    ? gerarSACTransform(state.params)
    : [{
        id: uid(),
        mesInicio: parseInt(mesInicio) || 1,
        mesFim: mesFim ? parseInt(mesFim) : undefined,
        frequencia: parseInt(frequencia) || 1,
        valor: parseFloat(valor) || 0,
        efeito,
        fgts,
        geradoPor: 'lote' as const,
        grupoId: uid(),
      }]

  const antes = simular(state.params, state.eventos)
  const depois = simular(state.params, [...state.eventos, ...novosEventos])

  const jurosEconomizados = antes.personalizado.totalJuros - depois.personalizado.totalJuros
  const mesesEconomizados = antes.personalizado.prazoReal - depois.personalizado.prazoReal

  const podeSalvar = isSACTransform || (parseFloat(valor) > 0)

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
          <h2 className="text-white font-semibold text-lg">
            {isSACTransform ? 'Transformar Price em SAC' : 'Adicionar amortização'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        {!isSACTransform && (
          <div className="flex flex-col gap-3 mb-5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mês início</label>
                <input
                  type="number" value={mesInicio} min={1} max={360}
                  onChange={(e) => setMesInicio(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mês fim (opcional)</label>
                <input
                  type="number" value={mesFim} min={1} max={360} placeholder="até o fim"
                  onChange={(e) => setMesFim(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 placeholder-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Valor (R$)</label>
                <input
                  type="number" value={valor} min={100} placeholder="ex: 1500"
                  onChange={(e) => {
                    const num = parseFloat(e.target.value) || 0
                    const sdInicio = antes.personalizado.serie.find(
                      (m) => m.mes === (parseInt(mesInicio) || 1)
                    )?.sdInicio ?? Infinity
                    if (num > sdInicio) {
                      const cap = Math.floor(sdInicio)
                      setValor(String(cap))
                      showToast(`Valor limitado ao saldo devedor (${moeda(cap)})`)
                      return
                    }
                    setValor(e.target.value)
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">A cada (meses)</label>
                <input
                  type="number" value={frequencia} min={1} max={360}
                  onChange={(e) => setFrequencia(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Efeito no contrato</label>
              <div className="grid grid-cols-2 gap-2">
                {(['reduzir_prazo', 'reduzir_parcela'] as EfeitoAporte[]).map((e) => (
                  <button key={e} onClick={() => setEfeito(e)}
                    className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      efeito === e ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}>
                    {e === 'reduzir_prazo' ? 'Reduzir prazo' : 'Reduzir parcela'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {efeito === 'reduzir_prazo' ? 'Economiza mais juros no longo prazo.' : 'Reduz o boleto mensal imediatamente.'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFgts}
                  className={`w-9 h-5 rounded-full transition-all relative ${fgts ? 'bg-emerald-500' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${fgts ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-gray-300">Usar FGTS</span>
              </div>
              {fgtsAcumulado > 0 && (
                <span className="text-xs text-gray-500">
                  Acumulado: <span className="text-emerald-400">{moeda(fgtsAcumulado)}</span>
                </span>
              )}
              {fgtsDeposito === 0 && (
                <span className="text-xs text-gray-600">Configure o FGTS nos parâmetros</span>
              )}
            </div>

          </div>
        )}

        {isSACTransform && (
          <p className="text-sm text-gray-400 mb-5">
            Calcula e aplica aportes extras mensais variáveis para que sua Price amortize exatamente o mesmo que o SAC em cada mês.
          </p>
        )}

        {/* Impacto */}
        <div className="bg-gray-800 rounded-xl p-4 mb-5 border border-gray-700">
          <p className="text-xs text-gray-500 mb-3 font-medium">IMPACTO ESTIMADO</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Juros economizados</p>
              <p className={`text-lg font-bold ${jurosEconomizados > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                {moeda(Math.max(0, jurosEconomizados))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tempo economizado</p>
              <p className={`text-lg font-bold ${mesesEconomizados > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                {mesesEconomizados > 0 ? meses(mesesEconomizados) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Novo prazo</p>
              <p className="text-base font-semibold text-white">{meses(depois.personalizado.prazoReal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Novo custo total</p>
              <p className="text-base font-semibold text-white">{moeda(depois.personalizado.totalPago)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-500 transition-all">
            Cancelar
          </button>
          <button
            onClick={() => { if (podeSalvar) { onApply(novosEventos); onClose() } }}
            disabled={!podeSalvar}
            className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium transition-all">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
