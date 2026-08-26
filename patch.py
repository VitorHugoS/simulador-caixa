import re

with open('src/components/inputs/CaixaApiImport.tsx', 'r') as f:
    content = f.read()

# 1. Micro-copy SAC/Price
old_sac_price = """                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-300 font-medium">Sistema</label>
                        <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                          {(['sac', 'price'] as Sistema[]).map((s) => (
                            <button key={s} onClick={() => setSistema(s)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${sistema === s ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                              {s === 'sac' ? 'SAC' : 'Price'}
                            </button>
                          ))}
                        </div>
                      </div>"""
new_sac_price = """                      <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-300 font-medium">Sistema</label>
                        <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                          {(['sac', 'price'] as Sistema[]).map((s) => (
                            <button key={s} onClick={() => setSistema(s)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${sistema === s ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                              {s === 'sac' ? 'SAC' : 'Price'}
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-500 px-1 mt-0.5 text-center">
                          {sistema === 'sac' ? 'Parcelas que diminuem ao longo do tempo' : 'Parcelas fixas do início ao fim'}
                        </span>
                      </div>"""
content = content.replace(old_sac_price, new_sac_price)

# 2. handleSimular setEtapa('preview')
old_simular = """    isRunningRef.current = true
    // Ordena: produto selecionado primeiro, depois os demais em ordem
    const idx = produtos.findIndex((p) => p.codigo === produtoInicial.codigo)"""
new_simular = """    setEtapa('preview')
    isRunningRef.current = true
    // Ordena: produto selecionado primeiro, depois os demais em ordem
    const idx = produtos.findIndex((p) => p.codigo === produtoInicial.codigo)"""
content = content.replace(old_simular, new_simular)

# 3. Preview section
old_preview = """            {etapa === 'preview' && extracted && (
              <>
                <div className="mb-5">
                  <h2 className="text-white font-semibold text-lg">Resultado da simulação</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Revise os valores antes de aplicar</p>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800">
                      <span className="text-xs text-gray-400">{label}</span>
                      {value ? <span className="text-sm font-medium text-white">{value}</span> : <span className="text-xs text-gray-600 italic">não encontrado</span>}
                    </div>
                  ))}
                </div>

                {entradaAjustada && (
                  <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl px-3 py-3 mb-4">
                    <p className="text-xs text-orange-400 font-semibold mb-1">Entrada ajustada pela Caixa</p>
                    <p className="text-xs text-orange-300">
                      Sua entrada de <span className="font-medium">R$ {entradaAjustada.solicitada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span> foi ajustada para <span className="font-medium">R$ {entradaAjustada.ajustada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>. Com sua renda, o máximo financiável é <span className="font-medium">R$ {entradaAjustada.valorFinanciamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span> (parcela limitada a 30% da renda mensal).
                    </p>
                  </div>
                )}

                {extracted.warnings.length > 0 && (
                  <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-3 py-2 mb-4">
                    <p className="text-xs text-amber-400 font-medium mb-1">Campos não encontrados:</p>
                    {extracted.warnings.map((w) => <p key={w} className="text-xs text-amber-500">· {w}</p>)}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button onClick={() => setEtapa('produtos')} className="py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-500 transition-all cursor-pointer">
                    Voltar
                  </button>
                  <button onClick={() => { onComplete(extracted.params); onClose() }} className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all cursor-pointer">
                    Aplicar
                  </button>
                </div>
              </>
            )}"""

new_preview = """            {(etapa === 'preview' || loading) && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-5">
                  <h2 className="text-white font-semibold text-lg">{loading ? 'Buscando melhor opção...' : 'Resultado da simulação'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{loading ? 'Conectando com a Caixa Econômica' : 'Revise os valores antes de aplicar'}</p>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-3 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                        <div className="h-3 bg-gray-800 rounded-full w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-800 rounded-full w-20 animate-pulse"></div>
                      </div>
                    ))}
                    <div className="h-16 bg-gray-800/50 rounded-xl w-full mt-2 animate-pulse"></div>
                  </div>
                ) : extracted && (
                  <>
                    <div className="flex flex-col gap-2 mb-4">
                      {rows.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800">
                          <span className="text-xs text-gray-400">{label}</span>
                          {value ? <span className="text-sm font-medium text-white">{value}</span> : <span className="text-xs text-gray-600 italic">não encontrado</span>}
                        </div>
                      ))}
                    </div>

                    {extracted.raw.primeiraParcela && inputCacheRef.current && (
                      <div className="mb-5">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs text-gray-400 font-medium">Saúde da Aprovação</span>
                          <span className="text-xs font-semibold text-white">R$ {extracted.raw.primeiraParcela.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-gray-500 font-normal">/ 1ª parcela</span></span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex relative">
                          {(() => {
                            const pct = Math.min(100, Math.max(0, (extracted.raw.primeiraParcela / (inputCacheRef.current.rendaNum * 0.3)) * 100))
                            let cor = 'bg-green-500'
                            let text = 'Muito provável de aprovar'
                            if (pct > 80) { cor = 'bg-yellow-500'; text = 'Próximo do limite da renda' }
                            if (pct >= 100) { cor = 'bg-red-500'; text = 'Risco de não aprovação (passa de 30%)' }
                            return (
                              <>
                                <div className={`h-full ${cor} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                                <div className="absolute top-3 left-0 w-full text-center">
                                  <span className={`text-[10px] font-medium ${cor.replace('bg-', 'text-')}`}>{text}</span>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                        <div className="h-4"></div>
                      </div>
                    )}

                    {entradaAjustada && (
                      <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl px-3 py-3 mb-4 mt-2">
                        <p className="text-xs text-orange-400 font-semibold mb-1">Entrada ajustada pela Caixa</p>
                        <p className="text-xs text-orange-300">
                          Sua entrada de <span className="font-medium">R$ {entradaAjustada.solicitada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span> foi ajustada para <span className="font-medium">R$ {entradaAjustada.ajustada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>. Com sua renda, o máximo financiável é <span className="font-medium">R$ {entradaAjustada.valorFinanciamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>.
                        </p>
                      </div>
                    )}

                    {extracted.warnings.length > 0 && (
                      <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-3 py-2 mb-4">
                        <p className="text-xs text-amber-400 font-medium mb-1">Campos não encontrados:</p>
                        {extracted.warnings.map((w) => <p key={w} className="text-xs text-amber-500">· {w}</p>)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <button onClick={() => setEtapa('produtos')} className="py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-500 transition-all cursor-pointer">
                        Voltar
                      </button>
                      <button onClick={() => { onComplete(extracted.params); onClose() }} className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all cursor-pointer">
                        Aplicar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}"""
content = content.replace(old_preview, new_preview)

with open('src/components/inputs/CaixaApiImport.tsx', 'w') as f:
    f.write(content)
