import { NextResponse } from 'next/server'

const CAIXA_HEADERS = {
  Authorization: 'Bearer undefined',
  accept: 'application/json',
  'accept-language': 'pt-BR,pt;q=0.9',
  'content-type': 'application/json',
  origin: 'https://simuladorhabitacao.caixa.gov.br',
  referer: 'https://simuladorhabitacao.caixa.gov.br/',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}

export async function GET() {
  try {
    const res = await fetch(
      'https://app.novosimulador.caixa.gov.br/api/v1/lista-uf',
      { headers: CAIXA_HEADERS }
    )
    if (!res.ok) return NextResponse.json({ error: `Caixa API retornou ${res.status}` }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API da Caixa' }, { status: 502 })
  }
}
