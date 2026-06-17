'use client'

import { useEffect, useRef, useState } from 'react'
import { AppState, Sistema } from '@/lib/engine/types'
import { fetchEnquadramento, fetchSimulacao } from '@/lib/caixa/api'
import { extractFromSimulacao } from '@/lib/caixa/extract'
import { useLocalidade } from '@/lib/caixa/useLocalidade'
import type { CaixaExtracted } from '@/lib/caixa/types'
import { InputField } from './InputField'

const CACHE_KEY = 'caixa_perfil'

interface Props {
  state: AppState
  onChange: (next: AppState) => void
}

type Etapa = 'form' | 'preview'

export function CaixaApiImport({ state, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<CaixaExtracted | null>(null)
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0)
  const rateLimitRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [entradaAjustada, setEntradaAjustada] = useState<{ solicitada: number; ajustada: number; valorFinanciamento: number } | null>(null)

  const [renda, setRenda] = useState('')
  const [valorImovel, setValorImovel] = useState('')
  const [valorEntrada, setValorEntrada] = useState('')
  const [entradaTocada, setEntradaTocada] = useState(false)
  const [prazo, setPrazo] = useState(String(state.params.n))
  const [sistema, setSistema] = useState<Sistema>(state.params.sistema)
  const [dataNascimento, setDataNascimento] = useState('1980-01-01')

  useEffect(() => {
    if (entradaTocada) return
    const imovelNum = parseFloat(valorImovel)
    if (!imovelNum) return
    const pct = sistema === 'sac' ? 0.20 : 0.30
    setValorEntrada(String(Math.round(imovelNum * pct)))
  }, [valorImovel, sistema]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    ufs, municipiosFiltrados, municipiosLoading,
    selectedUF, setSelectedUF,
    selectedMunicipio, setSelectedMunicipio,
    municipioSearch, setMunicipioSearch,
    geoStatus, geoAvailable, requestGeo, tryAutoGeo,
    loadFromCache,
  } = useLocalidade()

  useEffect(() => {
    if (!open) return
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const p = JSON.parse(cached)
        if (p.renda) setRenda(String(p.renda))
        if (p.valorImovel) setValorImovel(String(p.valorImovel))
        if (p.dataNascimento) setDataNascimento(p.dataNascimento)
        if (p.ufSgUf) {
          loadFromCache({ ufSgUf: p.ufSgUf, municipioCodigo: p.municipioCodigo, municipioNome: p.municipioNome })
        } else {
        }
      }
    } catch { /* ignore */ }
    // Auto-detect only if permission already granted — no dialog, no interaction block
    tryAutoGeo()
    setPrazo(String(state.params.n))
    setSistema(state.params.sistema)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBuscar() {
    const rendaNum = parseFloat(renda)
    const valorImovelNum = parseFloat(valorImovel)
    const valorEntradaNum = parseFloat(valorEntrada)
    const prazoNum = parseInt(prazo)

    if (!rendaNum || !valorImovelNum || !valorEntradaNum || !prazoNum || !dataNascimento) {
      setError('Preencha todos os campos.')
      return
    }
    if (!selectedUF || !selectedMunicipio) {
      setError('Selecione o estado e a cidade do imóvel.')
      return
    }
    if (prazoNum > 420) {
      setError('O prazo máximo é de 420 meses.')
      return
    }
    const entradaMinPct = sistema === 'sac' ? 0.20 : 0.30
    const entradaMin = valorImovelNum * entradaMinPct
    if (valorEntradaNum < entradaMin) {
      const pct = sistema === 'sac' ? '20%' : '30%'
      setError(`Entrada mínima para ${sistema.toUpperCase()} é ${pct} do valor do imóvel (R$ ${entradaMin.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}).`)
      return
    }

    const [y, m, d] = dataNascimento.split('-')
    const dataNascimentoAPI = `${d}/${m}/${y}`

    setLoading(true)
    setError(null)

    try {
      const produtos = await fetchEnquadramento(
        rendaNum, valorImovelNum, dataNascimentoAPI,
        selectedUF.coIbge, selectedMunicipio.codigo,
      )
      if (produtos.length === 0) {
        setError('Nenhum produto disponível para os dados informados.')
        return
      }

      const produto = produtos[0]

      const simulacaoData = await fetchSimulacao(produto, {
        renda: rendaNum,
        valorImovel: valorImovelNum,
        valorEntrada: valorEntradaNum,
        prazo: prazoNum,
        sistema,
        dataNascimento: dataNascimentoAPI,
        ufImovel: selectedUF.coIbge,
        municipioImovel: selectedMunicipio.codigo,
      })

      const apiEntrada = parseFloat(simulacaoData.valorEntrada ?? '0')
      if (apiEntrada > 0 && Math.abs(apiEntrada - valorEntradaNum) > 1) {
        setEntradaAjustada({
          solicitada: valorEntradaNum,
          ajustada: apiEntrada,
          valorFinanciamento: parseFloat(simulacaoData.valorFinanciamento ?? '0'),
        })
      } else {
        setEntradaAjustada(null)
      }

      const result = extractFromSimulacao(simulacaoData, sistema)
      setExtracted(result)
      setEtapa('preview')

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        renda: rendaNum,
        valorImovel: valorImovelNum,
        dataNascimento,
        ufSgUf: selectedUF.sgUf,
        municipioCodigo: selectedMunicipio.codigo,
        municipioNome: selectedMunicipio.nome,
      }))
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 429) {
        let secs = 60
        setRateLimitSecondsLeft(secs)
        rateLimitRef.current = setInterval(() => {
          secs -= 1
          setRateLimitSecondsLeft(secs)
          if (secs <= 0) {
            clearInterval(rateLimitRef.current!)
            rateLimitRef.current = null
          }
        }, 1000)
      }
      setError(e instanceof Error ? e.message : 'Não foi possível conectar com a API da Caixa.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    if (!extracted) return
    onChange({ ...state, params: { ...state.params, ...extracted.params } })
    handleClose()
  }

  function handleClose() {
    setOpen(false)
    setEtapa('form')
    setError(null)
    setExtracted(null)
    setEntradaAjustada(null)
  }

  const rows: { label: string; value: string | undefined }[] = [
    { label: 'Valor financiado', value: extracted?.raw.pv ? `R$ ${extracted.raw.pv}` : undefined },
    { label: 'Prazo', value: extracted?.raw.n },
    { label: 'Juros efetivos', value: extracted?.raw.iAnual },
    { label: 'Sistema', value: extracted?.raw.sistema },
    { label: 'MIP (taxa)', value: extracted?.raw.mipRate },
    { label: 'DFI + administração', value: extracted?.raw.taxasFixas },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="self-end text-xs text-blue-400 hover:text-blue-300 transition-colors pb-2.5 whitespace-nowrap"
      >
        🏦 Simular pela Caixa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-semibold text-lg">
                  {etapa === 'form' ? 'Simulação pela Caixa' : 'Resultado da simulação'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {etapa === 'form'
                    ? 'Consulta direta à API oficial do Simulador Habitacional'
                    : 'Revise os valores antes de aplicar'}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
            </div>

            {etapa === 'form' && (
              <>
                <div className="flex flex-col gap-3 mb-4">
                  <InputField
                    label="Renda bruta familiar mensal"
                    value={renda}
                    onChange={setRenda}
                    prefix="R$"
                    placeholder="9.000"
                    monetary
                  />
                  <InputField
                    label="Valor aproximado do imóvel"
                    value={valorImovel}
                    onChange={setValorImovel}
                    prefix="R$"
                    placeholder="260.000"
                    monetary
                  />
                  <InputField
                    label="Valor de entrada"
                    value={valorEntrada}
                    onChange={(v) => { setEntradaTocada(true); setValorEntrada(v) }}
                    prefix="R$"
                    placeholder="90.000"
                    monetary
                  />

                  {/* Estado (UF) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300 font-medium">Estado (UF)</label>
                      {geoAvailable && geoStatus === 'idle' && (
                        <button onClick={requestGeo} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          📍 Detectar localização
                        </button>
                      )}
                      {geoStatus === 'detecting' && <span className="text-xs text-blue-400 animate-pulse">Detectando…</span>}
                      {geoStatus === 'done' && <span className="text-xs text-green-500">✓ Localização detectada</span>}
                      {geoStatus === 'denied' && <span className="text-xs text-red-400">Localização negada</span>}
                    </div>
                    <select
                      value={selectedUF?.sgUf ?? ''}
                      onChange={(e) => setSelectedUF(ufs.find((u) => u.sgUf === e.target.value) ?? null)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Selecione um estado</option>
                      {ufs.map((uf) => (
                        <option key={uf.sgUf} value={uf.sgUf}>{uf.noUf} ({uf.sgUf})</option>
                      ))}
                    </select>
                  </div>

                  {/* Cidade */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-300 font-medium">Cidade</label>
                    {selectedMunicipio ? (
                      <div className="flex items-center justify-between w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                        <span className="text-white text-sm">{selectedMunicipio.nome}</span>
                        <button
                          onClick={() => { setSelectedMunicipio(null); setMunicipioSearch('') }}
                          className="text-gray-500 hover:text-gray-300 text-lg leading-none ml-2"
                        >×</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={municipioSearch}
                          onChange={(e) => setMunicipioSearch(e.target.value)}
                          placeholder={!selectedUF ? 'Selecione um estado primeiro' : municipiosLoading ? 'Carregando…' : 'Buscar cidade…'}
                          disabled={!selectedUF || municipiosLoading}
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {municipioSearch && municipiosFiltrados.length > 0 && (
                          <div className="absolute top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                            {municipiosFiltrados.map((m) => (
                              <button
                                key={m.codigo}
                                onClick={() => { setSelectedMunicipio(m); setMunicipioSearch('') }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors first:rounded-t-xl last:rounded-b-xl"
                              >
                                {m.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-300 font-medium">Data de nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Prazo"
                      value={prazo}
                      onChange={setPrazo}
                      suffix="meses"
                      placeholder="360"
                      min={12}
                      max={420}
                      step={12}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-300 font-medium">Sistema</label>
                      <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                        {(['sac', 'price'] as Sistema[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSistema(s)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              sistema === s
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
                </div>

                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                <button
                  onClick={handleBuscar}
                  disabled={loading || rateLimitSecondsLeft > 0}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-all"
                >
                  {loading ? 'Buscando…' : rateLimitSecondsLeft > 0 ? `Aguarde ${rateLimitSecondsLeft}s` : 'Buscar simulação'}
                </button>
              </>
            )}

            {etapa === 'preview' && extracted && (
              <>
                <div className="flex flex-col gap-2 mb-4">
                  {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-xs text-gray-400">{label}</span>
                      {value
                        ? <span className="text-sm font-medium text-white">{value}</span>
                        : <span className="text-xs text-gray-600 italic">não encontrado</span>
                      }
                    </div>
                  ))}
                </div>

                {entradaAjustada && (
                  <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl px-3 py-3 mb-4">
                    <p className="text-xs text-orange-400 font-semibold mb-1">Entrada ajustada pela Caixa</p>
                    <p className="text-xs text-orange-300">
                      Sua entrada de{' '}
                      <span className="font-medium">R$ {entradaAjustada.solicitada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>{' '}
                      foi ajustada para{' '}
                      <span className="font-medium">R$ {entradaAjustada.ajustada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>.
                      {' '}Com sua renda, o máximo financiável é{' '}
                      <span className="font-medium">R$ {entradaAjustada.valorFinanciamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>{' '}
                      (parcela limitada a 30% da renda mensal).
                    </p>
                  </div>
                )}

                {extracted.warnings.length > 0 && (
                  <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-3 py-2 mb-4">
                    <p className="text-xs text-amber-400 font-medium mb-1">Campos não encontrados:</p>
                    {extracted.warnings.map((w) => (
                      <p key={w} className="text-xs text-amber-500">· {w}</p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEtapa('form')}
                    className="py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-500 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleApply}
                    className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
                  >
                    Aplicar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
