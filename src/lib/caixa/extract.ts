import type { CaixaSimulacaoData } from './types'
import type { Sistema } from '../engine/types'
import type { CaixaExtracted } from './types'

// API values use US decimal format ("33.80"), not pt-BR ("33,80")
function parseAPI(s?: string): number {
  if (!s) return 0
  return parseFloat(s) || 0
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function extractFromSimulacao(data: CaixaSimulacaoData, sistema: Sistema): CaixaExtracted {
  const result: CaixaExtracted = { params: {}, raw: {}, warnings: [] }

  // pv
  if (data.valorFinanciamento) {
    result.params.pv = parseAPI(data.valorFinanciamento)
    result.raw.pv = fmtBRL(result.params.pv)
  } else {
    result.warnings.push('Valor de financiamento não encontrado')
  }

  // n
  const prazoStr = data.prazoDesejavel ?? data.prazoMaximo
  if (prazoStr) {
    result.params.n = parseInt(prazoStr)
    result.raw.n = prazoStr + ' meses'
  } else {
    result.warnings.push('Prazo não encontrado')
  }

  // iAnual — API uses "11.4900" (US decimal)
  if (data.jurosEfetivos) {
    result.params.iAnual = parseAPI(data.jurosEfetivos) / 100
    result.raw.iAnual = data.jurosEfetivos.replace('.', ',') + '% a.a.'
  } else {
    result.warnings.push('Juros efetivos não encontrados')
  }

  // sistema
  result.params.sistema = sistema
  result.raw.sistema = sistema === 'sac' ? 'SAC' : 'PRICE'

  // mipRate + taxasFixas from first prestação (nested under seguradoras.seguradora[0])
  const prestacaoRaw = data.seguradoras?.seguradora?.[0]?.prestacoes?.prestacao
  debugger
  // API returns a single object (not an array) for the first prestação
  const p1 = Array.isArray(prestacaoRaw) ? prestacaoRaw[0] : prestacaoRaw

  if (p1 && result.params.pv) {
    const seguros = p1.seguros?.seguro ?? []
    // codigo "1" = MIP (Morte/Invalidez Permanente), codigo "2" = DFI (Danos Físicos ao Imóvel)
    const mipSeguro = seguros.find((s) => s.codigo === '1')
    const dfiSeguro = seguros.find((s) => s.codigo === '2')

    if (mipSeguro) {
      const mipValor = parseAPI(mipSeguro.valor)
      result.params.mipRate = mipValor / result.params.pv
      result.raw.mipRate = `R$ ${fmtBRL(mipValor)} ÷ R$ ${fmtBRL(result.params.pv)} = ${(result.params.mipRate * 100).toFixed(5)}%/mês`
    } else {
      result.warnings.push('Seguro MIP não encontrado')
    }

    const dfi = parseAPI(dfiSeguro?.valor)
    const admin = parseAPI(p1.valorTaxaAdm)
    if (dfi > 0 || admin > 0) {
      result.params.taxasFixas = dfi + admin
      const parts: string[] = []
      if (dfi > 0) parts.push(`DFI R$ ${fmtBRL(dfi)}`)
      if (admin > 0) parts.push(`Admin R$ ${fmtBRL(admin)}`)
      result.raw.taxasFixas = parts.join(' + ') + ` = R$ ${fmtBRL(result.params.taxasFixas)}`
    } else {
      result.warnings.push('Taxa DFI/administração não encontrada')
    }
  } else {
    result.warnings.push('Plano de pagamento ausente — MIP e DFI não extraídos')
  }

  return result
}
