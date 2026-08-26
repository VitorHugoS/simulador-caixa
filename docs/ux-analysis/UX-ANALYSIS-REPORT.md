# Relatório de Análise UX/UI — FinanSim (v2, baseada em evidência)

**Data:** 2026-08-27
**Versão analisada:** Produção (`descomplica-financiamento.vercel.app`) + código local (`main`, commit `193f758`)
**Método:** Inspeção de DOM ao vivo (browser-use), leitura de todos os componentes em `src/`, medição de contraste WCAG de cores computadas, captura de 7 estados de tela.
**Observação:** A análise visual automática (visão) não estava disponível neste ambiente; a avaliação de cor/contraste foi feita por cálculo WCAG sobre `getComputedStyle` real, o que é mais preciso que descrição de imagem.

---

## 0. Screenshots (evidência)

Pasta: `docs/ux-analysis/`

| Arquivo | Estado capturado |
|---------|-----------------|
| `01-onboarding-step1.png` | Onboarding, Etapa 1 (Valores da simulação) |
| `02-dashboard-default.png` | Dashboard padrão (PV=300k, 360m, SAC), sem eventos |
| `03-dashboard-bottom-fab.png` | Rodapé do dashboard + FAB "Simular pela Caixa" |
| `04-dashboard-with-events.png` | Dashboard com FGTS ativo (templates CLT) |
| `05-modal-aporte.png` | Modal "Adicionar amortização" (impacto estimado) |
| `06-modal-caixa-form.png` | Modal "Simulação pela Caixa" (formulário) |
| `07-mobile-dashboard.png` | Dashboard em viewport mobile 390×844 (iPhone) |

---

## 1. O que JÁ FUNCIONA BEM (não mexer)

Estes itens foram implementados (commits recentes `dd453fd`, `48bb1c2`) e estão corretos — o relatório anterior os citava como problemas, mas o código atual já os resolveu:

1. **Onboarding com "Pular e usar valores padrão"** — existe (`CaixaOnboarding.tsx:596`). O usuário não é obrigado a preencher tudo.
2. **Termômetro "Saúde da Aprovação"** — existe no preview da Caixa (`CaixaApiImport.tsx:622-648`), com cores verde/amarelo/vermelho e texto contextual. Excelente trust signal.
3. **Skeletons durante loading da API** — existem (`CaixaApiImport.tsx:601-610`).
4. **Micro-copy e hints dinâmicos** — existem (ex: `InputField` tooltip, hint de entrada mínima, subtítulo do toggle SAC/Price).
5. **Cards de Aceleração CLT com gradiente e toggle visual** — existem (`CLTTemplates.tsx:87-149`), com estados ativo/inativo distintos.
6. **Modal de aporte com "Impacto estimado" ao vivo** — existe (`AmortizationModal.tsx:194-219`), calculando juros/tempo economizados antes de aplicar.
7. **FAB "Simular pela Caixa" sempre visível** — existe, fixo bottom-right (`CaixaApiImport.tsx:326-334`).
8. **Toasts de fallback de API** — existem (produto indisponível → tenta próximo).

**Conclusão:** o produto já tem boa base de UX. O que segue são os pontos que **ainda** têm problema real, com severidade justificada por evidência.

---

## 2. Problemas de Acessibilidade — CONTRASTE (evidência WCAG)

Medição feita sobre as cores reais computadas (`getComputedStyle`) do app em produção. Fundo `bg-gray-950` = `rgb(10,10,10)`, `bg-gray-900` = `rgb(17,24,39)`.

| Texto (classe Tailwind) | Cor | Contraste s/ #0a0a0a | Contraste s/ #111827 | WCAG AA (≥4.5:1) |
|--------------------------|-----|----------------------|----------------------|------------------|
| `text-gray-300` (labels) | rgb(209,213,219) | 13.44:1 | 12.04:1 | ✅ PASS |
| `text-gray-400` | rgb(156,163,175) | 7.80:1 | 6.99:1 | ✅ PASS |
| `text-gray-500` (suffix, hints, legendas) | rgb(107,114,128) | **4.10:1** | **3.67:1** | ❌ **FAIL** |
| `text-gray-600` (subtexto, footer, micro) | rgb(75,85,99) | **2.62:1** | **2.35:1** | ❌ **FAIL** |
| `text-green-400` / `text-red-400` | — | 11.36 / 7.16 | 10.18 / 6.41 | ✅ PASS |

**Impacto:** Qualquer texto em `gray-500` ou `gray-600` (suffixos de input como "R$", "% a.a.", "m"; legendas de gráfico; subtítulo do toggle Sistema; footer "Dados apenas ilustrativos"; micro-copy do modal) **não atinge WCAG AA para texto normal** (exige 4.5:1). `gray-600` é quase ilegível (2.35–2.62:1, próximo do limite de 3:1 para texto grande apenas).

**Onde aparece no código (amostra):**
- `SimulatorClient.tsx:130` — footer `text-gray-700` ("FinanSim · Dados apenas ilustrativos") → pior ainda que gray-600.
- `InputPanel.tsx:157` — subtítulo `text-gray-600`.
- `BalanceChart.tsx:84,89` e `PaymentChart.tsx:41,45` — ticks de eixo `text-gray-500` (#6b7280).
- `KPICards.tsx:129` — label de métrica `text-gray-500`.
- `AmortTable.tsx:80` — cabeçalhos `text-gray-500` / `text-white/60`.

**Recomendação (alta prioridade):** Substituir `gray-500 → gray-400` e `gray-600 → gray-400/500` em todos os textos informativos. Footer `gray-700 → gray-500`. Isso é uma mudança de token, não de layout.

---

## 3. Problemas de Hierarquia e Comunicação

### 3.1 Coluna "Personalizado" nos KPI Cards sempre zera sem eventos — confuso
**Evidência:** `KPICards.tsx:138` — o destaque "winner" (`WinnerCheck`) e o badge de % só aparecem quando `hasEvents` é verdadeiro. Sem eventos, a coluna "Personalizado" mostra os mesmos valores de SAC ou Price (pois `personalizado` == simulação pura quando não há aportes), mas **sem nenhum indicador de que está vazia/redundante**.

**Problema:** O usuário vê 3 colunas idênticas (SAC = Price = Personalizado) e não entende por que existe uma terceira. Não há label explicando "Personalizado = sua simulação com aportes".

**Recomendação:** 
- Quando `!hasEvents`, mostrar a coluna "Personalizado" desabilitada/esmaecida com tooltip "Adicione aportes para comparar" — ou ocultá-la por padrão (accordion).
- Adicionar subtítulo sob o header "Personalizado": "Ative aportes para preencher".

**Severidade:** MÉDIA (confusão cognitiva, não bloqueante).

### 3.2 Gráfico de saldo devedor: eixo Y sem unidade e "k" ambíguo
**Evidência:** `BalanceChart.tsx:88-91` — `YAxis tickFormatter={(v) => (v/1000).toFixed(0)+'k'}`, sem `label` de eixo. O "k" significa milhares de reais, mas não diz "R$". No eixo X, `tickFormatter={(v) => v+'m'}` (meses) com `interval={59}` — só mostra 6 rótulos em 360 meses.

**Problema:** 
- Usuário não sabe que o eixo Y é em R$ (milhares).
- Sem linha de referência em R$ 0 (quitado) nem anotação "Saldo zera no mês X".
- Tooltip existe mas só dispara no hover; em mobile (touch) não há estado de repouso informativo.

**Recomendação:**
- Adicionar `YAxis` com `label={{ value: 'Saldo (R$ mil)', angle: -90, position: 'insideLeft' }}`.
- Anotar o ponto de quitação (referência) quando `hasEvents`.

**Severidade:** MÉDIA.

### 3.3 Gráfico de composição da parcela amostra a cada 12 meses — pode esconder irregularidades
**Evidência:** `PaymentChart.tsx:19` — `serie.filter((_, i) => i % 12 === 0)`. Reduz 360→30 pontos.

**Problema:** Se o usuário usa aporte único (não recorrente), o pico some da amostra anual. A barra "Aporte" pode não aparecer nunca se o aporte cai no mês 6, por ex.

**Recomendação:** Amostrar a cada 6 meses, ou garantir que meses com `aporteExtra > 0` sempre entrem na amostra.

**Severidade:** BAIXA (precisão de visualização).

### 3.4 Toggle SAC/Price no InputPanel e nos KPI Cards usam cores diferentes dos gráficos
**Evidência:** 
- Cards KPI: SAC=`text-blue-400`, Price=`text-orange-400`, Personalizado=`text-white` (`KPICards.tsx:91-93`).
- Gráficos: Price=`#ef4444` (vermelho), SAC=`#3b82f6` (azul), Personalizado=`#10b981` (verde) (`BalanceChart.tsx:19-23`, `PaymentChart.tsx:58-61`).

**Problema:** Price é **laranja** nos cards e **vermelho** nos gráficos. Mapeamento mental inconsistente entre as duas visualizações do mesmo dado.

**Recomendação:** Unificar a paleta: SAC=azul, Price=laranja (ou vermelho) em TODOS os lugares. Personalizado=verde em ambos.

**Severidade:** BAIXA (consistência de design system).

---

## 4. Problemas de Fluxo / Onboarding

### 4.1 Onboarding de 2 passos ainda exige UF + Cidade + Nascimento para SIMULAR pela Caixa
**Evidência:** `CaixaApiImport.tsx:120-143` (`handleNextStep`) valida renda/imovel/entrada/prazo no passo 1; passo 2 exige UF, cidade, nascimento, tipo, categoria antes de `handleBuscar`.

**Problema:** Para quem quer só ver a simulação manual (não pela Caixa), o onboarding inicial (`CaixaOnboarding.tsx`) já vem com "Pular". Mas o modal "Simular pela Caixa" pede Nascimento + UF + Cidade — dados sensíveis que o usuário pode não querer dar só para "experimentar".

**Recomendação:** Permitir "Buscar simulação" com apenas renda + imóvel + entrada + prazo, deixando UF/Cidade/Nascimento como opcionais (a API da Caixa pode falhar, mas mostrar erro claro). Ou pré-preencher UF via geo detect.

**Severidade:** MÉDIA (atrito no diferencial do produto).

### 4.2 "Pular e usar valores padrão" não deixa claro o que são os padrões
**Evidência:** `CaixaOnboarding.tsx:596` — botão texto "Pular e usar valores padrão" sem mostrar os valores.

**Problema:** O usuário não sabe se vai ver uma simulação real ou "padrão fictício". Poderia gerar desconfiança ("será que meus dados foram usados?").

**Recomendação:** "Começar com exemplo (R$ 300k, 360m, SAC)" — explícito.

**Severidade:** BAIXA.

---

## 5. Mobile / Responsivo

**Evidência:** `07-mobile-dashboard.png` (390×844). O layout usa `max-w-6xl`, `grid-cols-1 sm:grid-cols-2` nos inputs, FAB `hidden sm:inline` para texto. Avaliado por CSS, não por visão (indisponível).

**Pontos verificados no código:**
- Inputs quebram para 1 coluna em mobile (`InputPanel.tsx:54` `flex-col ... lg:flex-row`) — OK.
- Templates CLT: `grid-cols-2 md:grid-cols-3` (`CLTTemplates.tsx:98`) — em mobile o FGTS ocupa `col-span-2` (ok).
- **Problema em mobile:** O `subtexto` do toggle Sistema (`text-gray-600`, `hidden lg:block` em `InputPanel.tsx:157`) some completamente no mobile — o usuário não vê a diferença SAC/Price. E o hint de entrada mínima some.
- Tabela mês a mês: `overflow-x-auto` (`AmortTable.tsx:74`) — OK, mas 9 colunas em 390px exigem scroll horizontal intenso.

**Recomendação:**
- Mostrar o subtítulo SAC/Price também em mobile (ou como tooltip no toggle).
- Considerar tabela com colunas prioritárias (Mês, Parcela, Saldo) em mobile, expandir para o resto.

**Severidade:** MÉDIA (mobile é provável viai principal de acesso).

---

## 6. Resumo de Prioridades (revisado, baseado em evidência)

| # | Problema | Evidência | Severidade | Esforço |
|---|----------|-----------|------------|---------|
| 1 | Contraste gray-500/gray-600 falha WCAG AA | medição 4.10/2.62:1 | **ALTA** | Baixo (token) |
| 2 | Footer `gray-700` ilegível | medição <2:1 | **ALTA** | Baixo |
| 3 | Coluna "Personalizado" redundante sem eventos | `KPICards.tsx:138` | MÉDIA | Médio |
| 4 | Eixo Y do gráfico sem unidade "R$" | `BalanceChart.tsx:88` | MÉDIA | Baixo |
| 5 | Onboarding Caixa pede dados sensíveis demais | `CaixaApiImport.tsx:120` | MÉDIA | Médio |
| 6 | Toggle SAC/Price some em mobile | `InputPanel.tsx:157 hidden lg:block` | MÉDIA | Baixo |
| 7 | Paleta SAC/Price inconsistente cards×gráficos | `KPICards` vs `BalanceChart` | BAIXA | Baixo |
| 8 | Amostragem anual esconde aportes únicos | `PaymentChart.tsx:19` | BAIXA | Baixo |
| 9 | "Pular" sem explicitar valores padrão | `CaixaOnboarding.tsx:596` | BAIXA | Baixo |

---

## 7. Notas para o Agente de Implementação

- **Design system atual:** Tailwind v4 (`@import "tailwindcss"`), Geist font, Recharts. Tokens em `globals.css` (`:root`).
- **Regra crítica do repo:** `AGENTS.md` avisa que esta é "NOT the Next.js you know" — APIs/convensões diferem. **Ler `node_modules/next/dist/docs/` antes de escrever código.**
- **Correção de contraste (item 1-2):** mudar em `globals.css` ou substituir classes `gray-500→gray-400`, `gray-600→gray-400`, `gray-700→gray-500` nos arquivos listados na Seção 2. Testar com `npx @axe-core/cli` ou Lighthouse após.
- **Não remover** Termômetro, Skeletons, micro-copy, FAB — já estão bons.
- **Testar em mobile real** (DevTools 390px) os itens 5-6.

---

## 8. Arquivos analisados

`src/app/page.tsx`, `SimulatorClient.tsx`, `layout.tsx`, `globals.css`,
`components/onboarding/CaixaOnboarding.tsx`, `components/inputs/InputPanel.tsx`,
`InputField.tsx`, `CaixaApiImport.tsx`, `components/kpis/KPICards.tsx`,
`components/charts/BalanceChart.tsx`, `PaymentChart.tsx`,
`components/amortization/EventList.tsx`, `CLTTemplates.tsx`, `AmortizationModal.tsx`,
`components/table/AmortTable.tsx`, `components/ui/icons.tsx`.
