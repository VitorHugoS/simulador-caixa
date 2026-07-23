import { describe, it, expect } from 'vitest'
import { simularBaselines } from './simulation'
import { DEFAULTS_SIMULAR } from './types'

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
})
