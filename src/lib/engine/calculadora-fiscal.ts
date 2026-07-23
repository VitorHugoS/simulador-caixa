// Tabelas de 2024 (Mantidas para 2025 até o momento)
export function calcularSalarioLiquido(salarioBruto: number): number {
  if (salarioBruto <= 0) return 0

  // 1. Cálculo do INSS Progressivo (2024)
  let inss = 0
  let restante = salarioBruto

  // Faixa 1: Até R$ 1.412,00 (7,5%)
  if (restante > 0) {
    const base = Math.min(restante, 1412.00)
    inss += base * 0.075
    restante -= base
  }
  // Faixa 2: De R$ 1.412,01 a R$ 2.666,68 (9%)
  if (restante > 0) {
    const base = Math.min(restante, 2666.68 - 1412.00)
    inss += base * 0.09
    restante -= base
  }
  // Faixa 3: De R$ 2.666,69 a R$ 4.000,03 (12%)
  if (restante > 0) {
    const base = Math.min(restante, 4000.03 - 2666.68)
    inss += base * 0.12
    restante -= base
  }
  // Faixa 4: De R$ 4.000,04 a R$ 7.786,02 (14%)
  if (restante > 0) {
    const base = Math.min(restante, 7786.02 - 4000.03)
    inss += base * 0.14
    restante -= base
  }
  // Teto do INSS: Não há desconto extra acima de R$ 7.786,02

  const baseIRPFLegal = salarioBruto - inss
  const baseIRPF = Math.min(baseIRPFLegal, salarioBruto - 564.80)

  let irpf = 0
  if (baseIRPF <= 2259.20) {
    irpf = 0
  } else if (baseIRPF <= 2826.65) {
    irpf = baseIRPF * 0.075 - 169.44
  } else if (baseIRPF <= 3751.05) {
    irpf = baseIRPF * 0.15 - 381.44
  } else if (baseIRPF <= 4664.68) {
    irpf = baseIRPF * 0.225 - 662.77
  } else {
    irpf = baseIRPF * 0.275 - 896.00
  }

  // Garantir que não seja negativo
  irpf = Math.max(0, irpf)

  // 3. Salário Líquido
  return salarioBruto - inss - irpf
}
