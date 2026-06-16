import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const sgUf = new URL(request.url).searchParams.get('sgUf')
  if (!sgUf) return NextResponse.json({ error: 'sgUf é obrigatório' }, { status: 400 })

  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sgUf}/municipios?orderBy=nome`,
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
