import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const preferredRegion = ['gru1']
export const revalidate = 86400

const PROXY = 'https://worker-caixa.worker-caixa.workers.dev'

export async function GET() {
  try {
    const res = await fetch(`${PROXY}/api/v1/lista-uf`)
    if (!res.ok) return NextResponse.json({ error: `Caixa API retornou ${res.status}` }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API da Caixa' }, { status: 502 })
  }
}
