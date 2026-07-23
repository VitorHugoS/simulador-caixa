import { describe, it, expect } from 'vitest'
import { calcularSalarioLiquido } from './calculadora-fiscal'

describe('Calculadora Fiscal', () => {
  it('calcula corretamente o salário líquido para R$ 5.000', () => {
    // Bruto: 5000
    // INSS 2024:
    // Faixa 1 (até 1412): 1412 * 0.075 = 105.90
    // Faixa 2 (1412.01 a 2666.68): 1254.68 * 0.09 = 112.92
    // Faixa 3 (2666.69 a 4000.03): 1333.35 * 0.12 = 160.00
    // Faixa 4 (4000.04 a 7786.02): 999.96 * 0.14 = 140.00
    // Total INSS: 518.82
    // 
    // Base IRRF = 5000 - 518.82 = 4481.18
    // Usamos a dedução padrão simplificada mantida pela base (564.80)
    // Tabela IRPF para a base (5000 - 564.80 = 4435.20) entra na faixa 22.5%:
    // 4435.20 * 0.225 - 662.77 = 997.92 - 662.77 = 335.15
    //
    // Líquido = 5000 - 518.82 (INSS) - 335.15 (IRPF) = 4146.03
    
    const liquido = calcularSalarioLiquido(5000)
    expect(liquido).toBeCloseTo(4146.03, 1)
  })

  it('retorna o próprio salário se for isento (ex: R$ 1.000)', () => {
    // INSS: 1000 * 0.075 = 75
    // IRPF: isento
    // Líquido: 925
    expect(calcularSalarioLiquido(1000)).toBeCloseTo(925, 2)
  })
})
