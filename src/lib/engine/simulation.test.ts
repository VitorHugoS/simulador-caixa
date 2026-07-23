import { describe, it, expect } from 'vitest'
import { simularBaselines, simularPersonalizado } from './simulation'
import { EventoAporte, DEFAULTS_SIMULAR, MesOutput } from './types'

describe('Motor Matemático - simulation.ts', () => {
  describe('Baselines (Sem Aportes Extras)', () => {
    it('calcula PRICE pura corretamente (Saldo zero no fim)', () => {
      const { pricePura } = simularBaselines(DEFAULTS_SIMULAR)
      
      expect(pricePura.prazoReal).toBe(360)
      
      const mes1 = pricePura.serie[0]
      expect(mes1.mes).toBe(1)
      expect(mes1.sdInicio).toBe(DEFAULTS_SIMULAR.pv)
      expect(mes1.aporteExtra).toBe(0)
      
      // Saldo devedor zera no último mês
      const ultimoMes = pricePura.serie[359]
      expect(ultimoMes.mes).toBe(360)
      expect(ultimoMes.sdFim).toBe(0)
    })

    it('calcula SAC pura corretamente (Amortização constante)', () => {
      const { sacPura } = simularBaselines(DEFAULTS_SIMULAR)
      
      expect(sacPura.prazoReal).toBe(360)
      
      const mes1 = sacPura.serie[0]
      expect(mes1.mes).toBe(1)
      expect(mes1.sdInicio).toBe(DEFAULTS_SIMULAR.pv)
      expect(mes1.aporteExtra).toBe(0)
      
      // 300.000 / 360 = 833.33
      expect(mes1.amortOrd).toBe(833.33)
      
      const ultimoMes = sacPura.serie[359]
      expect(ultimoMes.mes).toBe(360)
      
      // Matemática corrigida: amortização no último mês mata o resíduo
      expect(ultimoMes.sdFim).toBe(0)
    })
  })

  describe('Cenário Personalizado (Aportes Extras e Templates)', () => {
    it('aplica corretamente eventos do tipo template sem falhar e reduzindo o prazo', () => {
      const eventos: EventoAporte[] = [
        {
          id: 'template-13-salario',
          mesInicio: 12,
          frequencia: 12,
          valor: 5000,
          efeito: 'reduzir_prazo',
          fgts: false,
          geradoPor: 'template'
        }
      ]

      const out = simularPersonalizado(DEFAULTS_SIMULAR, eventos)
      
      // O prazo real deve ser menor que 360 meses devido à injeção anual de R$ 5000
      expect(out.prazoReal).toBeLessThan(360)

      // Verifica se no mês 12 ocorreu o aporte extra
      const mes12 = out.serie.find((m: MesOutput) => m.mes === 12)
      expect(mes12).toBeDefined()
      expect(mes12!.aporteExtra).toBe(5000)
    })
  })
})
