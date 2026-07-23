import { useState, useEffect } from 'react'
import { EventoAporte, Params } from '@/lib/engine/types'
import { InputField } from '@/components/inputs/InputField'

interface Props {
  eventos: EventoAporte[]
  params: Params
  onUpsert: (ev: EventoAporte) => void
  onRemove: (id: string) => void
  onUpdateParam: (key: keyof Params, value: number) => void
}

export function CLTTemplates({ eventos, params, onUpsert, onRemove, onUpdateParam }: Props) {
  const [salario, setSalario] = useState('5000')
  const active13 = eventos.some((e) => e.id === 'template-13-salario')
  const activeFerias = eventos.some((e) => e.id === 'template-ferias')
  const activeFgts = params.fgtsDeposito > 0

  const salarioNum = parseFloat(salario) || 0

  // Quando o usuário DIGITA um novo salário, atualiza os eventos ativos
  function handleSalarioChange(novoSalarioStr: string) {
    setSalario(novoSalarioStr)
    const valor = parseFloat(novoSalarioStr) || 0
    if (valor <= 0) return

    if (active13) {
      const ev = eventos.find((e) => e.id === 'template-13-salario')
      if (ev && ev.valor !== valor) {
        onUpsert({ ...ev, valor })
      }
    }

    if (activeFerias) {
      const ev = eventos.find((e) => e.id === 'template-ferias')
      const valorFerias = valor / 3
      if (ev && Math.abs(ev.valor - valorFerias) > 0.01) {
        onUpsert({ ...ev, valor: valorFerias })
      }
    }

    if (activeFgts) {
      const deposito = valor * 0.08
      if (Math.abs(params.fgtsDeposito - deposito) > 0.01) {
        onUpdateParam('fgtsDeposito', deposito)
      }
    }
  }

  function toggleTemplate(id: string, active: boolean, mesInicio: number, calcValor: (s: number) => number) {
    if (active) {
      onRemove(id)
    } else {
      if (salarioNum <= 0) return
      onUpsert({
        id,
        mesInicio,
        frequencia: 12,
        valor: calcValor(salarioNum),
        efeito: 'reduzir_prazo',
        fgts: false,
        geradoPor: 'template',
      })
    }
  }

  const toggle13 = () => toggleTemplate('template-13-salario', active13, 12, s => s)
  const toggleFerias = () => toggleTemplate('template-ferias', activeFerias, 6, s => s / 3)

  function toggleFgts() {
    if (activeFgts) {
      onUpdateParam('fgtsDeposito', 0)
    } else {
      if (params.fgtsDeposito === 0) {
        const base = salarioNum || 5000
        onUpdateParam('fgtsDeposito', base * 0.08)
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-800/40 rounded-2xl p-4 flex flex-col gap-4">
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <span>⚡</span> Aceleração 1-Click (CLT)
        </h3>
        <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
          Simule o impacto de injetar benefícios anuais no seu financiamento. 
          O efeito é sempre "reduzir prazo" para maximizar a economia de juros.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={toggle13}
          className={`relative overflow-hidden flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
            active13
              ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
              : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-sm font-medium ${active13 ? 'text-blue-400' : 'text-gray-300'}`}>
              13º Salário
            </span>
            <div className={`w-3 h-3 rounded-full border-2 ${active13 ? 'border-blue-400 bg-blue-500' : 'border-gray-600'}`} />
          </div>
          <span className="text-[10px] text-gray-500">1x salário a cada 12m</span>
        </button>

        <button
          onClick={toggleFerias}
          className={`relative overflow-hidden flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
            activeFerias
              ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-sm font-medium ${activeFerias ? 'text-purple-400' : 'text-gray-300'}`}>
              Férias (1/3)
            </span>
            <div className={`w-3 h-3 rounded-full border-2 ${activeFerias ? 'border-purple-400 bg-purple-500' : 'border-gray-600'}`} />
          </div>
          <span className="text-[10px] text-gray-500">1/3 do salário ao ano</span>
        </button>

        <button
          onClick={toggleFgts}
          className={`col-span-2 md:col-span-1 relative overflow-hidden flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
            activeFgts
              ? 'bg-emerald-600/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-sm font-medium ${activeFgts ? 'text-emerald-400' : 'text-gray-300'}`}>
              Usar FGTS
            </span>
            <div className={`w-3 h-3 rounded-full border-2 ${activeFgts ? 'border-emerald-400 bg-emerald-500' : 'border-gray-600'}`} />
          </div>
          <span className="text-[10px] text-gray-500">Saque-aniversário p/ abater</span>
        </button>
      </div>

      <div className="pt-2 border-t border-blue-900/30">
        <InputField
          label="Seu salário bruto (Base de cálculo)"
          tooltip="Usado para calcular automaticamente o FGTS (8%), 13º e Férias."
          value={salario}
          onChange={handleSalarioChange}
          prefix="R$"
          placeholder="5000"
          monetary
        />
      </div>

      {activeFgts && (
        <div className="pt-2 border-t border-emerald-900/30 animate-fade-in flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <InputField
              label="Depósito mensal FGTS"
              tooltip="Valor que cai na conta do FGTS (padrão 8% do Salário). Você pode alterar se o seu for diferente."
              value={String(params.fgtsDeposito)}
              onChange={(v) => onUpdateParam('fgtsDeposito', parseFloat(v) || 0)}
              prefix="R$"
              placeholder="400"
              monetary
            />
          </div>
          <div className="flex-1">
            <InputField
              label="Usar a cada"
              value={String(params.fgtsFrequencia)}
              onChange={(v) => onUpdateParam('fgtsFrequencia', parseFloat(v) || 0)}
              suffix="meses"
              placeholder="24"
              min={12}
              max={360}
              step={12}
            />
          </div>
        </div>
      )}
    </div>
  )
}
