import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const preferredRegion = ['gru1']

const CAIXA_URL = 'https://app.novosimulador.caixa.gov.br/api/v1/simulacao/simulacao-imobiliaria'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(CAIXA_URL, {
      method: 'POST',
      headers: CAIXA_HEADERS,
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      return NextResponse.json({ error: `Caixa API retornou ${response.status}` }, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API da Caixa' }, { status: 502 })
  }
}
