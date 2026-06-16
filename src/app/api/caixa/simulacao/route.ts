import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const preferredRegion = ['gru1']

const PROXY = 'https://worker-caixa.worker-caixa.workers.dev'
const CAIXA_PATH = '/api/v1/simulacao/simulacao-imobiliaria'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${PROXY}${CAIXA_PATH}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errBody = await response.json().catch(() => null)
      return NextResponse.json(
        errBody ?? { error: `Caixa API retornou ${response.status}` },
        { status: response.status },
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API da Caixa' }, { status: 502 })
  }
}
