'use client'

import { EventoAporte, Params } from '@/lib/engine/types'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Props {
  eventos: EventoAporte[]
  params: Params
  onRemoveGrupo: (grupoId: string) => void
  onRemoveEvento: (id: string) => void
  onAddClick: () => void
  onSACTransformClick: () => void
  onClearAll: () => void
  sistemaProposta: 'price' | 'sac'
}

function gruparEventos(eventos: EventoAporte[]) {
  const grupos = new Map<string, EventoAporte[]>()
  const individuais: EventoAporte[] = []

  for (const ev of eventos) {
    if (ev.grupoId) {
      const g = grupos.get(ev.grupoId) ?? []
      g.push(ev)
      grupos.set(ev.grupoId, g)
    } else {
      individuais.push(ev)
    }
  }

  return { grupos, individuais }
}

export function EventList({
  eventos, params, onRemoveGrupo, onRemoveEvento, onAddClick, onSACTransformClick, onClearAll, sistemaProposta,
}: Props) {
  const fgtsAuto = params.fgtsDeposito > 0
  const { grupos, individuais } = gruparEventos(eventos)
  const hasEventos = eventos.length > 0

  return (
    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Aportes extras</h3>
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

      {/* FGTS automático — derivado dos parâmetros, não removível aqui */}
      {fgtsAuto && (
        <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-800/40 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-sm text-emerald-300">
              FGTS automático · {moeda(params.fgtsDeposito * params.fgtsFrequencia)} a cada {params.fgtsFrequencia} meses
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Configurado nos parâmetros · amortiza saldo devedor
            </p>
          </div>
          <span className="text-xs text-emerald-700 ml-3">auto</span>
        </div>
      )}

      {!fgtsAuto && eventos.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-4">
          Nenhum aporte configurado. Adicione aportes para simular quitação antecipada.
        </p>
      )}

      {/* Grupos */}
      {Array.from(grupos.entries()).map(([grupoId, evs]) => {
        const primeiro = evs[0]
        const label = primeiro.geradoPor === 'sac-transform'
          ? `Price → SAC (${evs.length} eventos gerados)`
          : `Lote: ${moeda(primeiro.valor)} a cada ${primeiro.frequencia ?? 1}m`

        return (
          <div key={grupoId} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2.5">
            <div>
              <p className="text-sm text-white">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Mês {primeiro.mesInicio}{primeiro.mesFim ? ` → ${primeiro.mesFim}` : ''} ·{' '}
                {primeiro.efeito === 'reduzir_prazo' ? 'reduz prazo' : 'reduz parcela'}
                {primeiro.fgts ? ' · FGTS' : ''}
              </p>
            </div>
            <button
              onClick={() => onRemoveGrupo(grupoId)}
              className="text-gray-600 hover:text-red-400 transition-colors ml-3 text-lg leading-none"
            >
              ×
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
            onClick={() => onRemoveEvento(ev.id)}
            className="text-gray-600 hover:text-red-400 transition-colors ml-3 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
