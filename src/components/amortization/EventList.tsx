'use client'

import { XIcon } from '@/components/ui/icons'
import { EventoAporte, Params } from '@/lib/engine/types'
import { CLTTemplates } from './CLTTemplates'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Props {
  eventos: EventoAporte[]
  params: Params
  onRemoveGrupo: (grupoId: string) => void
  onRemoveEvento: (id: string) => void
  onUpsertEvento: (ev: EventoAporte) => void
  onUpdateParam: (key: keyof Params, value: number) => void
  onAddClick: () => void
  onSACTransformClick: () => void
  onClearAll: () => void
  sistemaProposta: 'price' | 'sac'
}

function gruparEventos(eventos: EventoAporte[]) {
  const grupos = new Map<string, EventoAporte[]>()
  const individuais: EventoAporte[] = []

  for (const ev of eventos) {
    if (ev.grupoId || ev.geradoPor === 'template') {
      const gId = ev.grupoId || ev.id // usa o próprio id como grupo se for template
      const g = grupos.get(gId) ?? []
      g.push(ev)
      grupos.set(gId, g)
    } else {
      individuais.push(ev)
    }
  }

  return { grupos, individuais }
}

export function EventList({
  eventos, params, onRemoveGrupo, onRemoveEvento, onUpsertEvento, onUpdateParam, onAddClick, onSACTransformClick, onClearAll, sistemaProposta,
}: Props) {
  const fgtsAuto = params.fgtsDeposito > 0
  const { grupos, individuais } = gruparEventos(eventos)
  const hasEventos = eventos.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Templates de 1-Click */}
      <CLTTemplates
        eventos={eventos}
        params={params}
        onUpsert={onUpsertEvento}
        onRemove={onRemoveEvento}
        onUpdateParam={onUpdateParam}
      />

      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Simular amortizações extras</h3>
        <div className="flex gap-2">
          {hasEventos && (
            <button
              onClick={onClearAll}
              className="text-xs px-3 py-1.5 rounded-lg text-red-500 hover:text-red-400 transition-colors"
            >
              Limpar tudo
            </button>
          )}
          {sistemaProposta === 'price' && (
            <button
              onClick={onSACTransformClick}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-900/40 border border-amber-700/50 text-amber-400 hover:bg-amber-900/60 transition-all"
            >
              Price → SAC
            </button>
          )}
          <button
            onClick={onAddClick}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-900/40 border border-blue-700/50 text-blue-400 hover:bg-blue-900/60 transition-all"
          >
            + Adicionar
          </button>
        </div>
      </div>

      {/* FGTS automático — derivado dos parâmetros, não removível aqui, apenas editável via CLTTemplates */}
      {fgtsAuto && (
        <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800/40 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-sm text-emerald-300">
              FGTS automático · {moeda(params.fgtsDeposito * params.fgtsFrequencia)} a cada {params.fgtsFrequencia} meses
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Editável no painel de Aceleração · amortiza saldo devedor
            </p>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-900/50 text-emerald-400 border border-emerald-800">Automático</span>
        </div>
      )}

      {!fgtsAuto && eventos.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-4">
          Nenhum aporte configurado. Adicione aportes para simular quitação antecipada.
        </p>
      )}

      {Array.from(grupos.entries()).map(([gId, evs]) => {
        const primeiro = evs[0]
        const isTemplate = primeiro.geradoPor === 'template'
        
        let label = ''
        if (primeiro.geradoPor === 'sac-transform') {
          label = `Price → SAC (${evs.length} eventos gerados)`
        } else if (isTemplate) {
          label = primeiro.id === 'template-13-salario' ? '13º Salário' : 'Férias (1/3)'
        } else {
          label = `Lote: ${moeda(primeiro.valor)} a cada ${primeiro.frequencia ?? 1}m`
        }

        return (
          <div key={gId} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2.5">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-white">{label}</p>
                {isTemplate && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-900/50 text-blue-300 border border-blue-800">Automático</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {moeda(primeiro.valor)} no Mês {primeiro.mesInicio}{primeiro.mesFim ? ` → ${primeiro.mesFim}` : ''} (a cada {primeiro.frequencia}m) ·{' '}
                {primeiro.efeito === 'reduzir_prazo' ? 'reduz prazo' : 'reduz parcela'}
                {primeiro.fgts ? ' · FGTS' : ''}
              </p>
            </div>
            <button
              aria-label="Remover aporte"
              onClick={() => isTemplate ? onRemoveEvento(primeiro.id) : onRemoveGrupo(gId)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-all cursor-pointer ms-2 flex-shrink-0"
            >
              <XIcon aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        )
      })}

      {/* Individuais */}
      {individuais.map((ev) => (
        <div key={ev.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-sm text-white">
              {moeda(ev.valor)} no mês {ev.mesInicio}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {ev.efeito === 'reduzir_prazo' ? 'Reduz prazo' : 'Reduz parcela'}
              {ev.fgts ? ' · FGTS' : ''}
            </p>
          </div>
          <button
            aria-label="Remover aporte individual"
            onClick={() => onRemoveEvento(ev.id)}
            className="text-gray-600 hover:text-red-400 transition-colors ms-3 text-lg leading-none"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        ))}
      </div>
    </div>
  )
}
