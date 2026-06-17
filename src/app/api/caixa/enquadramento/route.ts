import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const preferredRegion = ['gru1']
export const revalidate = 3600

const PROXY = 'https://worker-caixa.worker-caixa.workers.dev'
const CAIXA_PATH = '/api/v1/simulacao/produtos-enquadramento-simulacao'

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
    const response = await fetch(`${PROXY}${CAIXA_PATH}?${params}`, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_TOKEN ?? '',
        'X-Client-IP': request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown',
      },
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        err.error ? err : { error: `Caixa API retornou ${response.status}` },
        { status: response.status },
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API da Caixa' }, { status: 502 })
  }
}
