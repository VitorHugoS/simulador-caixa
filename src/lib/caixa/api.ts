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
): Promise<CaixaProduto[]> {
  const params = new URLSearchParams({
    renda: String(renda),
    valorImovel: String(valorImovel),
    dataNascimento,
    ufImovel: String(ufImovel),
    municipioImovel: String(municipioImovel),
  })
  const res = await fetch(`/api/caixa/enquadramento?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Enquadramento falhou: ${res.status}`)
  }
  const data = await res.json()
  const list: CaixaProduto[] = Array.isArray(data)
    ? data
    : (data.produtosSimulacaoEnquadramento ?? data.produtos ?? data.listaProdutos ?? [])
  return list.map((p) => ({ ...p, codigo: String(p.codigo), versao: String(p.versao) }))
}

export async function fetchSimulacao(
  produto: CaixaProduto,
  input: CaixaApiInput,
): Promise<CaixaSimulacaoData> {
  const body = {
    simulacao: {
      enquadramentoProduto: {
        tipoPessoa: '1',
        autorizaArmazenamentoDadosCliente: 'S',
        dataNascimentoComprador: input.dataNascimento,
        relacionamentoCaixa: 'N',
        trabalhoSobFgts: 'S',
        rendaBrutaFamiliarMensal: input.renda.toFixed(2),
        fatorSocial: 'N',
        loteAlienadoHipotecado: 'N',
        portabilidadeCreditoImobiliario: 'N',
        categoriaImovel: '4',
        possuoImovelMunicipio: 'N',
        subsidioFgtsUniao: 'N',
        tipoFinanciamento: '1',
        municipioImovel: String(input.municipioImovel),
        ufImovel: String(input.ufImovel),
        valorAproximadoImovel: input.valorImovel.toFixed(2),
      },
      produto: { codigo: produto.codigo, versao: produto.versao },
      seguradora: { codigo: '14' },
      sistemaAmortizacao: { codigo: input.sistemaCodigo },
      valorEntrada: input.valorEntrada.toFixed(2),
      prazoDesejavel: String(input.prazo),
      numeroPropostaOnline: '',
    },
  }

  const res = await fetch('/api/caixa/simulacao', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Simulação falhou: ${res.status}`)
  }
  const data = await res.json()
  return data.simulacao ?? data
}
