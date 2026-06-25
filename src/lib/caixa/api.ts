import type { CaixaProduto, CaixaApiInput, CaixaSimulacaoData, CaixaUF, CaixaMunicipio } from './types'

export async function fetchUFs(): Promise<CaixaUF[]> {
  const res = await fetch('/api/caixa/ufs')
  if (!res.ok) throw new Error(`UFs falhou: ${res.status}`)
  const data = await res.json()
  const list: CaixaUF[] = Array.isArray(data) ? data : (data.data ?? [])
  return list.map((u) => ({ ...u, noUf: u.noUf.trim() }))
}

export async function fetchMunicipios(sgUf: string): Promise<CaixaMunicipio[]> {
  const res = await fetch(`/api/caixa/municipios?sgUf=${sgUf}`)
  if (!res.ok) throw new Error(`Municípios falhou: ${res.status}`)
  const data = await res.json()
  const list: CaixaMunicipio[] = Array.isArray(data) ? data : (data.data ?? [])
  return list
}

export async function fetchEnquadramento(
  renda: number,
  valorImovel: number,
  dataNascimento: string,
  ufImovel: number,
  municipioImovel: number,
  tipoFinanciamento: string,
  categoriaImovel: string,
): Promise<CaixaProduto[]> {
  const params = new URLSearchParams({
    renda: String(renda),
    valorImovel: String(valorImovel),
    dataNascimento,
    ufImovel: String(ufImovel),
    municipioImovel: String(municipioImovel),
    tipoFinanciamento,
    categoriaImovel,
  })
  const res = await fetch(`/api/caixa/enquadramento?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.error ?? `Enquadramento falhou: ${res.status}`), { status: res.status })
  }
  const data = await res.json()
  const list: CaixaProduto[] = Array.isArray(data)
    ? data
    : (data.produtosSimulacaoEnquadramento ?? data.produtos ?? data.listaProdutos ?? [])
  return list.map((p) => ({ ...p, codigo: String(p.codigo), versao: String(p.versao) }))
}

const _simCache = new Map<string, { data: CaixaSimulacaoData; ts: number }>()
const SIM_TTL = 5 * 60 * 1000

export async function fetchSimulacao(
  produto: CaixaProduto,
  input: CaixaApiInput,
): Promise<CaixaSimulacaoData> {
  const cacheKey = JSON.stringify({ produto, input })
  const hit = _simCache.get(cacheKey)
  if (hit && Date.now() - hit.ts < SIM_TTL) return hit.data

  const baseSimulacao = {
    enquadramentoProduto: {
      codigo: '15',
      tipoPessoa: '1',
      autorizaArmazenamentoDadosCliente: 'S',
      dataNascimentoComprador: input.dataNascimento,
      relacionamentoCaixa: 'N',
      trabalhoSobFgts: 'S',
      rendaBrutaFamiliarMensal: input.renda.toFixed(2),
      fatorSocial: 'N',
      loteAlienadoHipotecado: 'N',
      portabilidadeCreditoImobiliario: 'N',
      possuoImovelMunicipio: 'N',
      subsidioFgtsUniao: 'N',
      tipoFinanciamento: input.tipoFinanciamento,
      categoriaImovel: input.categoriaImovel,
      municipioImovel: String(input.municipioImovel),
      ufImovel: String(input.ufImovel),
      valorAproximadoImovel: input.valorImovel.toFixed(2),
    },
    produto: { codigo: produto.codigo, versao: produto.versao },
    valorEntrada: input.valorEntrada.toFixed(2),
    prazoDesejavel: String(input.prazo),
    numeroPropostaOnline: '',
  }

  const doCall = async (extraFields?: Record<string, unknown>): Promise<CaixaSimulacaoData> => {
    const res = await fetch('/api/caixa/simulacao', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ simulacao: { ...baseSimulacao, ...extraFields } }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const errorCode = err.errors?.[0]?.codigo
      const msg = errorCode === '198'
        ? 'Renda insuficiente. A parcela estimada compromete mais de 30% da sua renda mensal. Tente aumentar a renda, reduzir o valor financiado ou aumentar a entrada.'
        : err.errors?.[0]?.descricao ?? err.error ?? `Simulação falhou: ${res.status}`
      throw Object.assign(new Error(msg), { status: res.status })
    }
    const data = await res.json()
    return data.simulacao ?? data
  }

  // First call without sistemaAmortizacao/seguradora — API returns available options
  const first = await doCall()

  // Find the correct sistema code for user's preference (SAC or Price)
  const sistemas = first.sistemasAmortizacao?.sistemaAmortizacao ?? []
  const keyword = input.sistema === 'sac' ? 'SAC' : 'PRICE'
  const targetSistema = sistemas.find((s) => s.descricao?.toUpperCase().startsWith(keyword))
  const usedSistema = sistemas.find((s) => s.utilizadoNesteCalculo === 'S')

  // Pick the first available insurance provider
  const seguradoras = first.seguradoras?.seguradora ?? []
  const firstSeguradora = seguradoras[0]

  const extraFields: Record<string, any> = {}
  let needsSecondCall = false

  if (targetSistema && targetSistema.codigo !== usedSistema?.codigo) {
    extraFields.sistemaAmortizacao = { codigo: targetSistema.codigo }
    needsSecondCall = true
  }

  if (firstSeguradora && firstSeguradora.prestacoes?.prestacao == null) {
    extraFields.seguradora = { codigo: firstSeguradora.codigo }
    needsSecondCall = true
  }

  // If we found a preferred system or need to select a seguradora to get full data, call again
  const result = needsSecondCall ? await doCall(extraFields) : first
  _simCache.set(cacheKey, { data: result, ts: Date.now() })
  return result
}
