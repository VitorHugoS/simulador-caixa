import { describe, it, expect } from 'vitest'
import { MUNICIPIOS_BY_UF } from '@/data/municipios'
import { GET } from '@/app/api/caixa/municipios/route'
import { NextRequest } from 'next/server'

describe('Municípios Locais e Endpoint da Caixa', () => {
  it('contém todas as 27 UFs na base estática', () => {
    const ufs = Object.keys(MUNICIPIOS_BY_UF)
    expect(ufs.length).toBe(27)
    expect(ufs).toContain('MG')
    expect(ufs).toContain('SP')
    expect(ufs).toContain('RJ')
    expect(ufs).toContain('DF')
  })

  it('possui 853 municípios em MG e inclui Ituiutaba com código correto', () => {
    const mg = MUNICIPIOS_BY_UF['MG']
    expect(mg.length).toBe(853)
    const ituiutaba = mg.find((m) => m.nome === 'ITUIUTABA')
    expect(ituiutaba).toBeDefined()
    expect(ituiutaba?.codigo).toBe(3134202)
    expect(ituiutaba?.sgUf).toBe('MG')
  })

  it('possui 645 municípios em SP e inclui São Paulo com código correto', () => {
    const sp = MUNICIPIOS_BY_UF['SP']
    expect(sp.length).toBe(645)
    const saoPaulo = sp.find((m) => m.nome === 'SÃO PAULO')
    expect(saoPaulo).toBeDefined()
    expect(saoPaulo?.codigo).toBe(3550308)
    expect(saoPaulo?.sgUf).toBe('SP')
  })

  it('GET /api/caixa/municipios?sgUf=MG retorna 200 e lista correta', async () => {
    const req = new NextRequest('http://localhost:3000/api/caixa/municipios?sgUf=MG')
    const res = await GET(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(853)
    expect(data.some((m: { nome: string }) => m.nome === 'BELO HORIZONTE')).toBe(true)
  })

  it('GET /api/caixa/municipios sem sgUf retorna 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/caixa/municipios')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('sgUf é obrigatório')
  })
})
