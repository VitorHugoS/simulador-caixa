import { AppState, SimResult } from '@/lib/engine/types'

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Props {
  state: AppState
  result: SimResult
}

export function HeroSummary({ state, result }: Props) {
  const pv = state.params.pv
  const primeiraParcela = result.personalizado.serie[0]?.parcela || 0
  const prazoOriginal = state.params.n
  const prazoReal = result.personalizado.prazoReal

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
      {/* Principal destaque */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[28px] p-6 shadow-xl shadow-blue-900/20 flex flex-col justify-between relative overflow-hidden md:col-span-2">
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Valor financiado</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {moeda(pv)}
          </h2>
        </div>
        <div className="relative z-10 mt-8 flex flex-wrap gap-6">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-0.5">Primeira parcela</p>
            <p className="text-xl font-semibold text-white">{moeda(primeiraParcela)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs font-medium mb-0.5">Sistema</p>
            <p className="text-xl font-semibold text-white uppercase">{state.params.sistema}</p>
          </div>
        </div>
        {/* Enfeite visual */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute right-12 top-4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl"></div>
      </div>

      {/* Secundário */}
      <div className="bg-gray-900 rounded-[28px] border border-gray-800 p-6 flex flex-col justify-center gap-4">
        <div>
          <p className="text-gray-400 text-xs font-medium mb-1">Tempo de quitação</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">{Math.floor(prazoReal / 12)} anos</span>
            {prazoReal < prazoOriginal && (
              <span className="text-sm font-medium text-emerald-400 mb-1 line-through opacity-60">
                {Math.floor(prazoOriginal / 12)}a
              </span>
            )}
          </div>
        </div>
        <div className="h-px bg-gray-800 w-full"></div>
        <div>
          <p className="text-gray-400 text-xs font-medium mb-1">Custo Total</p>
          <p className="text-lg font-semibold text-gray-200">
            {moeda(result.personalizado.totalPago)}
          </p>
        </div>
      </div>
    </div>
  )
}
