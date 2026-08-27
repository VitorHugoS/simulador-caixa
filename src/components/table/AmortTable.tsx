'use client'

import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons'
import { AppState, MesData } from '@/lib/engine/types'

const PAGE_SIZE = 50

function moeda(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  serie: MesData[]
  state: AppState
  showCorrecao?: boolean
  onRowClick?: (row: MesData) => void
}

export function AmortTable({ serie, state, showCorrecao = false, onRowClick }: Props) {
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState(false)

  const totalPages = Math.ceil(serie.length / PAGE_SIZE)
  const slice = serie.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function exportCSV() {
    const correcaoHeader = showCorrecao ? ',Correção TR' : ''
    const header = `Mês,Juros${correcaoHeader},Amort.,Taxas,Parcela,Aporte,Total Pago,Saldo Devedor`
    const rows = serie.map((m) => {
      const correcaoCell = showCorrecao ? `,${m.correcaoMonetaria.toFixed(2)}` : ''
      return [m.mes, m.juros, m.amortOrd, m.taxas, m.parcela, m.aporteExtra, m.parcela + m.aporteExtra, m.sdFim]
        .map((v) => typeof v === 'number' ? v.toFixed(2) : v)
        .join(',')
        .replace(/^([^,]+,)/, `$1${correcaoCell.slice(1)},`)
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'finansim.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF('p', 'pt', 'a4')
    
    // Título
    doc.setFontSize(16)
    doc.text('FinanSim - Simulação de Financiamento', 40, 40)
    
    // Obter dados adicionais
    let renda = 0
    let valorImovel = 0
    try {
      const cached = localStorage.getItem('caixa_perfil')
      if (cached) {
        const p = JSON.parse(cached)
        renda = p.renda || 0
        valorImovel = p.valorImovel || 0
      }
    } catch {
      // Ignore cache read errors
    }

    const pv = state.params.pv
    const entrada = valorImovel > 0 ? (valorImovel - pv) : 0
    const dataHora = new Date().toLocaleString('pt-BR')

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Gerado em: ${dataHora}`, 40, 56)

    doc.setTextColor(0)
    doc.text(`Valor Financiado: ${moeda(pv)}`, 40, 80)
    if (entrada > 0) doc.text(`Entrada (estimada): ${moeda(entrada)}`, 40, 96)
    if (renda > 0) doc.text(`Renda Bruta: ${moeda(renda)}`, 40, 112)
    doc.text(`Total de parcelas: ${serie.length}`, 40, 128)

    const baseHeaders = ['Mês', 'Juros', 'Amort.', 'Taxas', 'Parcela', 'Aporte', 'Total Pago', 'Saldo']
    const headersPDF = showCorrecao
      ? ['Mês', 'Juros', 'Amort.', 'Taxas', 'Corr. TR', 'Parcela', 'Aporte', 'Total Pago', 'Saldo']
      : baseHeaders

    const tableData = serie.map((m) => {
      const row = [
        m.mes,
        moeda(m.juros),
        moeda(m.amortOrd),
        moeda(m.taxas),
      ]
      
      if (showCorrecao) {
        row.push(moeda(m.correcaoMonetaria))
      }
      
      row.push(
        moeda(m.parcela),
        moeda(m.aporteExtra),
        moeda(m.parcela + m.aporteExtra),
        moeda(m.sdFim)
      )
      return row
    })

    autoTable(doc, {
      head: [headersPDF],
      body: tableData,
      startY: 150,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138] }, // bg-blue-900
      alternateRowStyles: { fillColor: [243, 244, 246] }, // bg-gray-100
    })

    doc.save('finansim.pdf')
  }

  const baseHeaders = ['Mês', 'Juros', 'Amort.', 'Taxas', 'Parcela', 'Aporte', 'Total Pago', 'Saldo Devedor']
  const headers = showCorrecao
    ? ['Mês', 'Juros', 'Amort.', 'Taxas', 'Correção TR', 'Parcela', 'Aporte', 'Total Pago', 'Saldo Devedor']
    : baseHeaders

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-semibold text-white">
          Cronograma de parcelas ({serie.length} meses)
        </span>
        {open ? <ChevronUpIcon strokeWidth={2} aria-hidden="true" className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon strokeWidth={2} aria-hidden="true" className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <>
          <div className="px-4 pb-3 flex justify-end gap-2">
            <button
              onClick={exportCSV}
              className="text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
            >
              Exportar CSV
            </button>
            <button
              onClick={exportPDF}
              className="text-xs px-3 py-1.5 bg-blue-900/30 border border-blue-800/50 rounded-lg text-blue-400 hover:text-blue-300 hover:border-blue-700 transition-all cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-gray-800">
                  {headers.map((h) => (
                    <th key={h} className={`px-3 py-2 text-left font-medium whitespace-nowrap ${
                      h === 'Parcela' || h === 'Aporte' || h === 'Total Pago' ? 'text-white/60' : 'text-gray-500'
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map((m) => (
                  <tr
                    key={m.mes}
                    role="button"
                    tabIndex={0}
                    onClick={() => onRowClick?.(m)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick?.(m)
                      }
                    }}
                    className={`border-b border-gray-800/50 cursor-pointer ${m.temEvento ? 'bg-emerald-900/10 hover:bg-emerald-900/20' : 'hover:bg-gray-800/40'}`}
                  >
                    <td className="px-3 py-2 text-gray-300 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {m.mes}
                        {m.temEvento && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-red-400 whitespace-nowrap">{moeda(m.juros)}</td>
                    <td className="px-3 py-2 text-blue-400 whitespace-nowrap">{moeda(m.amortOrd)}</td>
                    <td className="px-3 py-2 text-amber-400 whitespace-nowrap">{moeda(m.taxas)}</td>
                    {showCorrecao && (
                      <td className="px-3 py-2 text-orange-400 whitespace-nowrap">
                        {m.correcaoMonetaria > 0 ? moeda(m.correcaoMonetaria) : '—'}
                      </td>
                    )}
                    <td className="px-3 py-2 text-white whitespace-nowrap font-medium">{moeda(m.parcela)}</td>
                    <td className="px-3 py-2 text-emerald-400 whitespace-nowrap">
                      {m.aporteExtra > 0 ? moeda(m.aporteExtra) : '—'}
                    </td>
                    <td className="px-3 py-2 text-white whitespace-nowrap font-semibold border-l border-gray-800">
                      {moeda(m.parcela + m.aporteExtra)}
                    </td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{moeda(m.sdFim)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-800 rounded-lg text-gray-400 disabled:opacity-30 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="text-xs text-gray-500">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-800 rounded-lg text-gray-400 disabled:opacity-30 hover:text-white transition-all cursor-pointer"
              >
                Próxima <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
