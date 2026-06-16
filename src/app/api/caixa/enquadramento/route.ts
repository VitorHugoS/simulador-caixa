import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const preferredRegion = ['gru1']

const CAIXA_URL = 'https://app.novosimulador.caixa.gov.br/api/v1/simulacao/produtos-enquadramento-simulacao'

const FIXED_PARAMS: Record<string, string> = {
  tipoPessoa: '1',
  autorizaArmazenamentoDadosCliente: 'S',
  relacionamentoCaixa: 'N',
  trabalhoSobFgts: 'S',
  fatorSocial: 'N',
  loteAlienadoHipotecado: 'N',
  portabilidadeCreditoImobiliario: 'N',
  categoriaImovel: '4',
  possuoImovelMunicipio: 'N',
  subsidioFgtsUniao: 'N',
  tipoFinanciamento: '1',
}

const CAIXA_HEADERS = {
  Authorization: 'Bearer undefined',
  accept: 'application/json',
  'accept-language': 'pt-BR,pt;q=0.9',
  'content-type': 'application/json',
  origin: 'https://simuladorhabitacao.caixa.gov.br',
  referer: 'https://simuladorhabitacao.caixa.gov.br/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const renda = searchParams.get('renda')
  const valorImovel = searchParams.get('valorImovel')
  const dataNascimento = searchParams.get('dataNascimento') ?? '01/01/1980'
  const ufImovel = searchParams.get('ufImovel') ?? '31'
  const municipioImovel = searchParams.get('municipioImovel') ?? '3134202'

  if (!renda || !valorImovel) {
    return NextResponse.json({ error: 'renda e valorImovel são obrigatórios' }, { status: 400 })
  }

  const params = new URLSearchParams({
    ...FIXED_PARAMS,
    dataNascimentoComprador: dataNascimento,
    rendaBrutaFamiliarMensal: parseFloat(renda).toFixed(2),
    valorAproximadoImovel: parseFloat(valorImovel).toFixed(2),
    ufImovel,
    municipioImovel,
  })

  try {
    const response = await fetch(`${CAIXA_URL}?${params}`, { headers: CAIXA_HEADERS })
    if (!response.ok) {
      return NextResponse.json({ error: `Caixa API retornou ${response.status}` }, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API da Caixa' }, { status: 502 })
  }
}
