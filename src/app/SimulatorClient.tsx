'use client'

import { useEffect, useState } from 'react'
import { useUrlState } from '@/lib/hooks/useUrlState'
import { useSimulator } from '@/lib/hooks/useSimulator'
import { EventoAporte, MesData } from '@/lib/engine/types'
import { LinkIcon, CheckIcon } from '@/components/ui/icons'
import { CaixaOnboarding } from '@/components/onboarding/CaixaOnboarding'
import { InputPanel } from '@/components/inputs/InputPanel'
import { KPICards } from '@/components/kpis/KPICards'
import { BalanceChart } from '@/components/charts/BalanceChart'
import { PaymentChart } from '@/components/charts/PaymentChart'
import { EventList } from '@/components/amortization/EventList'
import { AmortizationModal } from '@/components/amortization/AmortizationModal'
import { AmortTable } from '@/components/table/AmortTable'
import { RowDetailModal } from '@/components/table/RowDetailModal'

export function SimulatorClient() {
  const { state, dispatch, hasUrlState } = useUrlState()
  const result = useSimulator(state)
  const [modalOpen, setModalOpen] = useState(false)
  const [sacTransformOpen, setSacTransformOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedRow, setSelectedRow] = useState<MesData | null>(null)
  // Start false on both server and client — avoids hydration mismatch.
  // useEffect sets the real value after hydration (safe to read localStorage).
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('caixa_perfil') || hasUrlState) setOnboarded(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!onboarded) {
    return (
      <CaixaOnboarding
        onComplete={(params) => {
          dispatch({ type: 'UPDATE_PARAMS', payload: params })
          setOnboarded(true)
        }}
        onSkip={() => setOnboarded(true)}
      />
    )
  }

  function applyEventos(novos: EventoAporte[]) {
    dispatch({ type: 'ADD_EVENTOS', payload: novos })
  }

  function removeGrupo(grupoId: string) {
    dispatch({ type: 'REMOVE_GRUPO', grupoId })
  }

  function removeEvento(id: string) {
    dispatch({ type: 'REMOVE_EVENTO', id })
  }

  function upsertEvento(ev: EventoAporte) {
    dispatch({ type: 'UPSERT_EVENTO', payload: ev })
  }

  function saveRowEvento(mes: number, novos: EventoAporte[]) {
    dispatch({ type: 'SET_OVERRIDE', mes, payload: novos })
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="text-white font-bold text-sm">FinanSim</span>
          <button
            onClick={copyLink}
            className="inline-flex items-center justify-center min-w-[120px] gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-colors active:scale-[0.96] cursor-pointer"
          >
            <div className="relative w-3.5 h-3.5">
              <CheckIcon 
                className={`absolute inset-0 text-green-400 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${copied ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-50 blur-[4px]'}`} 
              />
              <LinkIcon 
                className={`absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${copied ? 'opacity-0 scale-50 blur-[4px]' : 'opacity-100 scale-100 blur-0'}`} 
              />
            </div>
            <span className="relative">
              <span className={`block transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${copied ? 'opacity-100 translate-y-0 text-green-400' : 'opacity-0 absolute inset-0 translate-y-2'}`} aria-hidden={!copied}>
                Copiado!
              </span>
              <span className={`block transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${copied ? 'opacity-0 absolute inset-0 -translate-y-2' : 'opacity-100 translate-y-0'}`} aria-hidden={copied}>
                Compartilhar
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-5">
        <InputPanel
          state={state}
          dispatch={dispatch}
        />
        <KPICards
          result={result}
          hasEvents={state.eventos.length > 0 || state.params.fgtsDeposito > 0}
          sistema={state.params.sistema}
          prazoContratado={state.params.n}
        />

        {/* Gráficos */}
        <BalanceChart
          result={result}
          hasEvents={state.eventos.length > 0 || state.params.fgtsDeposito > 0}
        />
        <PaymentChart result={result} />

        {/* Aportes */}
        <EventList
          eventos={state.eventos}
          params={state.params}
          onRemoveGrupo={removeGrupo}
          onRemoveEvento={removeEvento}
          onUpsertEvento={upsertEvento}
          onUpdateParam={(k, v) => dispatch({ type: 'UPDATE_PARAM', key: k, value: v })}
          onAddClick={() => setModalOpen(true)}
          onSACTransformClick={() => setSacTransformOpen(true)}
          onClearAll={() => dispatch({ type: 'SET_EVENTOS', payload: [] })}
          sistemaProposta={state.params.sistema}
        />

        {/* Tabela */}
        <AmortTable
          serie={result.personalizado.serie}
          showCorrecao={state.params.trAnual > 0}
          onRowClick={(row) => setSelectedRow(row)}
        />

        <p className="text-center text-xs text-gray-700 pb-4">
          FinanSim · Dados apenas ilustrativos · Consulte seu banco para valores exatos
        </p>
      </div>

      {modalOpen && (
        <AmortizationModal
          state={state}
          onApply={applyEventos}
          onClose={() => setModalOpen(false)}
        />
      )}

      {sacTransformOpen && (
        <AmortizationModal
          state={state}
          onApply={applyEventos}
          onClose={() => setSacTransformOpen(false)}
          isSACTransform
        />
      )}

      {selectedRow && (
        <RowDetailModal
          row={selectedRow}
          state={state}
          onSave={saveRowEvento}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  )
}
