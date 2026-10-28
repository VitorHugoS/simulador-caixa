import { NextRequest, NextResponse } from 'next/server'
import { MUNICIPIOS_BY_UF } from '@/data/municipios'

export const runtime = 'edge'
export const preferredRegion = ['gru1']
export const revalidate = 86400 // municípios por UF são estáticos; cache 24h

export async function GET(request: NextRequest) {
  const sgUf = new URL(request.url).searchParams.get('sgUf')?.toUpperCase()
  if (!sgUf) return NextResponse.json({ error: 'sgUf é obrigatório' }, { status: 400 })

  // 1. Instant response from static local dataset (0ms latency, 100% uptime)
  const local = MUNICIPIOS_BY_UF[sgUf]
  if (local && local.length > 0) {
    return NextResponse.json(local, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  }

  // 2. Dynamic fallback to IBGE API if UF not found locally
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sgUf}/municipios?orderBy=nome`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      },
    )
    if (!res.ok) return NextResponse.json({ error: `IBGE API retornou ${res.status}` }, { status: res.status })
    const data: { id: number; nome: string }[] = await res.json()
    // Normalize to CaixaMunicipio shape: id = IBGE code (used as municipioImovel in Caixa API)
    const municipios = data.map((m) => ({ codigo: m.id, nome: m.nome.toUpperCase(), sgUf }))
    return NextResponse.json(municipios)
  } catch {
    return NextResponse.json({ error: 'Falha ao conectar com a API do IBGE' }, { status: 502 })
  }
}
