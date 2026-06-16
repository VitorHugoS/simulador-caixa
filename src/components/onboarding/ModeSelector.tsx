'use client'

import { ModoEntrada } from '@/lib/engine/types'

interface Props {
  onSelect: (modo: ModoEntrada) => void
}

export function ModeSelector({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">FinanSim</h1>
        <p className="text-gray-400 text-base">Simulador de financiamento imobiliário</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <button
          onClick={() => onSelect('proposta')}
          className="group bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-2xl p-6 text-left transition-all"
        >
          <div className="text-2xl mb-3">📄</div>
          <h2 className="text-white font-semibold text-lg mb-1">Tenho minha proposta do banco</h2>
          <p className="text-gray-400 text-sm">
            Insira os dados exatos do seu contrato e simule estratégias de quitação antecipada.
          </p>
        </button>

        <button
          onClick={() => onSelect('simular')}
          className="group bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500 rounded-2xl p-6 text-left transition-all"
        >
          <div className="text-2xl mb-3">🔍</div>
          <h2 className="text-white font-semibold text-lg mb-1">Quero explorar e entender</h2>
          <p className="text-gray-400 text-sm">
            Use valores típicos de mercado e descubra como funciona o financiamento antes de decidir.
          </p>
        </button>
      </div>

      <p className="mt-10 text-gray-600 text-xs text-center max-w-xs">
        100% gratuito · Sem cadastro · Seus dados ficam só no seu navegador
      </p>
    </div>
  )
}
