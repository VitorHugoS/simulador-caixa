import { describe, it, expect } from 'vitest'
import { resolverAportes } from './events'
import { EventoAporte } from './types'

describe('Regras de Negócio - events.ts', () => {
  const dummyParams = { n: 360, fgtsDeposito: 0, fgtsFrequencia: 0 }

  describe('Conflito de Efeitos', () => {
    it('soma os valores e prioriza reduzir_prazo quando eventos colidem', () => {
      const eventos: EventoAporte[] = [
        { id: '1', mesInicio: 10, valor: 1000, efeito: 'reduzir_parcela', fgts: false, geradoPor: 'lote', grupoId: 'g1' },
        { id: '2', mesInicio: 10, valor: 2000, efeito: 'reduzir_prazo', fgts: false, geradoPor: 'lote', grupoId: 'g1' },
      ]

      const resolvidos = resolverAportes(eventos, dummyParams)

      // No mês 10, deve ter 3000 com efeito reduzir_prazo
      expect(resolvidos[10]).toBeDefined()
      expect(resolvidos[10].valorAcumulado).toBe(3000)
      expect(resolvidos[10].efeitoFinal).toBe('reduzir_prazo')
    })
  })

  describe('Override de Mês', () => {
    it('evento override descarta completamente lotes e FGTS do mesmo mês', () => {
      const eventos: EventoAporte[] = [
        { id: 'lote', mesInicio: 24, valor: 500, efeito: 'reduzir_parcela', fgts: false, geradoPor: 'lote', grupoId: 'g1' },
        { id: 'over', mesInicio: 24, valor: 900, efeito: 'reduzir_parcela', fgts: false, geradoPor: 'override', grupoId: 'g2' },
      ]
      
      const paramsFgts = { n: 360, fgtsDeposito: 200, fgtsFrequencia: 24 } // No mês 24, teria +4800 de FGTS automático

      const resolvidos = resolverAportes(eventos, paramsFgts)

      // No mês 24, apenas o override de 900 deve sobreviver. O FGTS e o lote de 500 evaporam.
      expect(resolvidos[24]).toBeDefined()
      expect(resolvidos[24].valorAcumulado).toBe(900)
      expect(resolvidos[24].efeitoFinal).toBe('reduzir_parcela')
    })
  })

  describe('Injeção Automática de FGTS', () => {
    it('injeta o acumulado de FGTS nos meses certos com efeito reduzir_prazo', () => {
      const paramsFgts = { n: 360, fgtsDeposito: 500, fgtsFrequencia: 12 }
      const resolvidos = resolverAportes([], paramsFgts)

      expect(resolvidos[11]).toBeUndefined()
      
      expect(resolvidos[12]).toBeDefined()
      expect(resolvidos[12].valorAcumulado).toBe(6000) // 500 * 12
      expect(resolvidos[12].efeitoFinal).toBe('reduzir_prazo')
      
      expect(resolvidos[24]).toBeDefined()
      expect(resolvidos[24].valorAcumulado).toBe(6000)
    })
  })
})
