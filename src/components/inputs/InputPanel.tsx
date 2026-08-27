'use client'

import { AppState, Params, Sistema } from '@/lib/engine/types'
import { InputField } from './InputField'
import { CaixaApiImport } from './CaixaApiImport'

import { AppAction } from '@/lib/engine/state'

interface Props {
  state: AppState
  dispatch: (action: AppAction) => void
}

function fmt(n: number): string { return String(n) }
function pct(n: number): string { return String((n * 100).toFixed(4)) }
function mipPct(n: number): string { return String((n * 100).toFixed(5)) }

export function InputPanel({ state, dispatch }: Props) {
  const { params } = state

  function updateParam(key: keyof Params, raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    dispatch({ type: 'UPDATE_PARAM', key, value })
  }

  function updateIAnual(raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    dispatch({ type: 'UPDATE_PARAM', key: 'iAnual', value: value / 100 })
  }

  function updateTrAnual(raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    dispatch({ type: 'UPDATE_PARAM', key: 'trAnual', value: value / 100 })
  }

  function updateMipRate(raw: string) {
    const value = raw === '' ? 0 : parseFloat(raw)
    if (isNaN(value)) return
    dispatch({ type: 'UPDATE_PARAM', key: 'mipRate', value: value / 100 })
  }

  function updateSistema(sistema: Sistema) {
    dispatch({ type: 'UPDATE_PARAM', key: 'sistema', value: sistema })
  }

  return (
    <div className="bg-gray-900 rounded-[28px] border border-gray-800">
      {/* Linha principal de parâmetros */}
      <div className="p-4">
        {/* Fluid flex grid for inputs */}
        <div className="flex flex-wrap items-end gap-3">

          <div className="flex-1 min-w-[180px] lg:max-w-[220px]">
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

          <div className="flex-1 min-w-[120px] lg:max-w-[140px]">
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

          <div className="flex-1 min-w-[130px] lg:max-w-[160px]">
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

          <div className="flex-1 min-w-[130px] lg:max-w-[150px]">
            <InputField
              label="Correção (TR)"
              tooltip="Taxa Referencial anual projetada. Contratos SAC/TR e PRICE/TR da Caixa corrigem o saldo todo mês por este índice. Bancos e o CET sempre usam 0%. Histórico: 2022 ≈ 1,4%, 2023 ≈ 1,9%, 2024 ≈ 1,4%."
              value={String((params.trAnual * 100).toFixed(2))}
              onChange={updateTrAnual}
              suffix="% a.a."
              placeholder="0.00"
              min={0}
              max={20}
              step={0.1}
            />
          </div>

          <div className="flex-1 min-w-[130px] lg:max-w-[140px]">
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

          <div className="flex-1 min-w-[130px] lg:max-w-[150px]">
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
          <div className="flex-1 min-w-[160px] flex flex-col gap-1">
            <label id="sistema-label" className="text-sm text-gray-300 font-medium">Sistema</label>
            <div role="radiogroup" aria-labelledby="sistema-label" className="flex gap-1 bg-gray-800 rounded-xl p-1">
              {(['sac', 'price'] as Sistema[]).map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={params.sistema === s}
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
        </div>

        {/* Subtexto sistema */}
        <p className="text-xs text-gray-600 mt-2 hidden lg:block">
          {params.sistema === 'sac'
            ? 'SAC: amortização constante, parcela decrescente.'
            : 'Price: parcela fixa, amortiza pouco nos primeiros anos.'}
        </p>
      </div>

      {/* FAB + modal da simulação Caixa — renderizado fora do layout de inputs */}
      <CaixaApiImport state={state} dispatch={dispatch} />
    </div>
  )
}
