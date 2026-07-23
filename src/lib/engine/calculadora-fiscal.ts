// Tabelas de 2024 (Mantidas para 2025 até o momento)
export function calcularSalarioLiquido(salarioBruto: number): number {
  if (salarioBruto <= 0) return 0

  // 1. Cálculo do INSS Progressivo (2024)
  let inss = 0
  let restante = salarioBruto

  const faixasINSS = [
    { teto: 1412.00, aliquota: 0.075 },
    { teto: 2666.68, aliquota: 0.09 },
    { teto: 4000.03, aliquota: 0.12 },
    { teto: 7786.02, aliquota: 0.14 }
  ]

  let pisoAnterior = 0
  for (const faixa of faixasINSS) {
    if (restante <= 0) break
    const tamanhoFaixa = faixa.teto - pisoAnterior
    const base = Math.min(restante, tamanhoFaixa)
    inss += base * faixa.aliquota
    restante -= base
    pisoAnterior = faixa.teto
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
