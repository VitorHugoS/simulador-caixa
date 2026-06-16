'use client'

import { useEffect, useState } from 'react'
import { useUrlState } from '@/lib/hooks/useUrlState'
import { useSimulator } from '@/lib/hooks/useSimulator'
import { EventoAporte, MesData } from '@/lib/engine/types'
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
  const { state, setState, hasUrlState } = useUrlState()
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
          setState((prev) => ({ ...prev, params: { ...prev.params, ...params } }))
          setOnboarded(true)
        }}
        onSkip={() => setOnboarded(true)}
      />
    )
  }

  function applyEventos(novos: EventoAporte[]) {
    setState((prev) => ({ ...prev, eventos: [...prev.eventos, ...novos] }))
  }

  function removeGrupo(grupoId: string) {
    setState((prev) => ({
      ...prev,
      eventos: prev.eventos.filter((e) => e.grupoId !== grupoId),
    }))
  }

  function removeEvento(id: string) {
    setState((prev) => ({
      ...prev,
      eventos: prev.eventos.filter((e) => e.id !== id),
    }))
  }

  function saveRowEvento(mes: number, novos: EventoAporte[]) {
    setState((prev) => ({
      ...prev,
      eventos: [
        ...prev.eventos.filter((e) => !(e.mesInicio === mes && e.geradoPor === 'override')),
        ...novos,
      ],
    }))
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
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all"
          >
            {copied ? '✓ Copiado!' : '🔗 Compartilhar'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-5">
        <InputPanel
          state={state}
          onChange={setState}
        />
        <KPICards
          result={result}
          hasEvents={state.eventos.length > 0 || state.params.fgtsDeposito > 0}
          sistema={state.params.sistema}
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
          onAddClick={() => setModalOpen(true)}
          onSACTransformClick={() => setSacTransformOpen(true)}
          onClearAll={() => setState((prev) => ({ ...prev, eventos: [] }))}
          sistemaProposta={state.params.sistema}
        />

        {/* Tabela */}
        <AmortTable
          serie={result.personalizado.serie}
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
