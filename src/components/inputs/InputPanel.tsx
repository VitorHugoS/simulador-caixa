'use client'

import { useState } from 'react'
import { AppState, Params, Sistema } from '@/lib/engine/types'
import { InputField } from './InputField'
import { CaixaApiImport } from './CaixaApiImport'

interface Props {
  state: AppState
  onChange: (next: AppState) => void
}

function fmt(n: number): string { return String(n) }
function pct(n: number): string { return String((n * 100).toFixed(4)) }
function mipPct(n: number): string { return String((n * 100).toFixed(5)) }

export function InputPanel({ state, onChange }: Props) {
  const { params } = state
  const [showFgts, setShowFgts] = useState(params.fgtsDeposito > 0)

  function updateParam(key: keyof Params, raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    onChange({ ...state, params: { ...params, [key]: value } })
  }

  function updateIAnual(raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    onChange({ ...state, params: { ...params, iAnual: value / 100 } })
  }

  function updateMipRate(raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    onChange({ ...state, params: { ...params, mipRate: value / 100 } })
  }

  function updateSistema(sistema: Sistema) {
    onChange({ ...state, params: { ...params, sistema } })
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800">
      {/* Linha principal de parâmetros */}
      <div className="p-4">
        {/* Mobile: coluna / Desktop: linha */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3 lg:flex-wrap">

          <div className="lg:w-40 xl:w-48">
            <InputField
              label="Valor financiado"
              tooltip="Montante pedido ao banco (PV). Não inclui a entrada."
              value={fmt(params.pv)}
              onChange={(v) => updateParam('pv', v)}
              prefix="R$"
              placeholder="300.000"
              monetary
            />
          </div>

          <div className="lg:w-28">
            <InputField
              label="Prazo"
              tooltip="Duração total em meses. 360 meses = 30 anos."
              value={fmt(params.n)}
              onChange={(v) => updateParam('n', v)}
              suffix="m"
              placeholder="360"
              min={12}
              max={420}
              step={12}
            />
          </div>

          <div className="lg:w-36">
            <InputField
              label="Taxa anual"
              tooltip="Taxa efetiva anual informada no contrato."
              value={pct(params.iAnual)}
              onChange={updateIAnual}
              suffix="% a.a."
              placeholder="11.49"
              min={0.1}
              max={30}
              step={0.01}
            />
          </div>

          <div className="lg:w-28">
            <InputField
              label="DFI + admin"
              tooltip="Seguro DFI + taxa de administração mensal (valores fixos do contrato)."
              value={fmt(params.taxasFixas)}
              onChange={(v) => updateParam('taxasFixas', v)}
              prefix="R$"
              placeholder="42"
              monetary
            />
          </div>

          <div className="lg:w-32">
            <InputField
              label="MIP mensal"
              tooltip="Taxa MIP = % do saldo devedor por mês. Calcule: MIP da 1ª parcela ÷ Saldo devedor. Ex: R$20,87 ÷ R$180.000 = 0,01159%."
              value={mipPct(params.mipRate)}
              onChange={updateMipRate}
              suffix="% saldo"
              placeholder="0.01159"
              min={0}
              step={0.001}
            />
          </div>

          {/* Sistema toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-medium">Sistema</label>
            <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
              {(['sac', 'price'] as Sistema[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateSistema(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    params.sistema === s
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s === 'sac' ? 'SAC' : 'Price'}
                </button>
              ))}
            </div>
          </div>

          {/* FGTS toggle compacto — sempre visível na linha */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-medium">FGTS</label>
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5 h-[42px]">
              <button
                onClick={() => {
                  if (showFgts) {
                    setShowFgts(false)
                    onChange({ ...state, params: { ...params, fgtsDeposito: 0 } })
                  } else {
                    setShowFgts(true)
                    if (params.fgtsDeposito === 0) {
                      onChange({ ...state, params: { ...params, fgtsDeposito: 500 } })
                    }
                  }
                }}
                className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${showFgts ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all pointer-events-none ${showFgts ? 'left-4' : 'left-0.5'}`} />
              </button>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {showFgts
                  ? `R$${params.fgtsDeposito.toLocaleString('pt-BR')}/mês`
                  : 'Desativado'}
              </span>
            </div>
          </div>

          <CaixaApiImport state={state} onChange={onChange} />
        </div>

        {/* Subtexto sistema */}
        <p className="text-xs text-gray-600 mt-2 hidden lg:block">
          {params.sistema === 'sac'
            ? 'SAC: amortização constante, parcela decrescente.'
            : 'Price: parcela fixa, amortiza pouco nos primeiros anos.'}
        </p>
      </div>

      {/* Linha FGTS — aparece quando ativado */}
      {showFgts && (
        <div className="border-t border-gray-800 px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3 rounded-b-2xl">
          <div className="lg:w-40">
            <InputField
              label="Depósito mensal FGTS"
              tooltip="Quanto cai na sua conta do FGTS por mês. Geralmente 8% do salário bruto."
              value={fmt(params.fgtsDeposito)}
              onChange={(v) => updateParam('fgtsDeposito', v)}
              prefix="R$"
              placeholder="500"
              monetary
            />
          </div>

          <div className="lg:w-36">
            <InputField
              label="Usar a cada"
              tooltip="Com que frequência usar o FGTS. Mínimo legal: 12 meses. Mais comum: 24 meses."
              value={fmt(params.fgtsFrequencia)}
              onChange={(v) => updateParam('fgtsFrequencia', v)}
              suffix="meses"
              placeholder="24"
              min={12}
              max={360}
              step={12}
            />
          </div>

          <div className="flex flex-col gap-1 justify-end pb-0.5">
            <p className="text-xs text-gray-500">
              Acumulado por uso:{' '}
              <span className="text-emerald-400 font-medium">
                R$ {(params.fgtsDeposito * params.fgtsFrequencia).toLocaleString('pt-BR')}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
