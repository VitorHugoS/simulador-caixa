# Relatório de Análise UX/UI — FinanSim

**Data:** 2026-08-27  
**Versão analisada:** Produção (descomplica-financiamento.vercel.app)  
**Responsável:** Análise sistemática de UX/UI para redesign/refinamento

---

## 1. Visão Geral do Produto

### Surface Type: **Monitor/Configure**
FinanSim é um **simulador de financiamento imobiliário**. O usuário é um potencial mutuário que quer:
1. Comparar sistemas de amortização (SAC vs Price)
2. Simular aportes extras e uso do FGTS
3. Visualizar economia de juros e prazo

**Usuário-alvo:** Brasileiros planejando comprar imóvel financiado, com pouca familiaridade técnica mas necessidade de precisão.

---

## 2. Arquitetura da Informação

### Fluxo atual:

```
[Onboarding - Etapa 1: Valores] 
    ↓
[Onboarding - Etapa 2: Localização/Tipo]
    ↓
[Onboarding - Etapa 3: Seleção de Produto CAIXA (opcional)]
    ↓
[Onboarding - Etapa 4: Preview da Simulação CAIXA (opcional)]
    ↓
[Dashboard Principal - Simulação Manual]
```

### Componentes mordidos:
- `CaixaOnboarding.tsx` — Onboarding multi-step com 4 etapas
- `InputPanel.tsx` — Painel de parâmetros da simulação
- `CaixaApiImport.tsx` — Importação via API CAIXA (FAB)
- `KPICards.tsx` — Cards comparativos SAC/Price/Personalizado
- `BalanceChart.tsx` — Gráfico de evolução do saldo devedor
- `PaymentChart.tsx` — Gráfico de evolução das parcelas
- `EventList.tsx` — Lista de aportes/templates
- `AmortizationModal.tsx` — Modal para adicionar aportes
- `AmortTable.tsx` — Tabela mês a mês colapsável
- `RowDetailModal.tsx` — Detalhe por mês (eventos)

---

## 3. Problemas de UX Identificados

### 🔴 ALTA Prioridade

#### 3.1 Onboarding longo demais para valor percebido
**Problema:** 4 etapas obrigatórias antes de ver qualquer resultado.  
**Etapa 1** (renda, imóvel, entrada, prazo, sistema) + **Etapa 2** (UF, cidade, nascimento, tipo) + **Etapa 3** (busca API CAIXA) + **Etapa 4** (preview com múltiplas tentativas).

**Impacto:** Abandono alto. Usuário quer ver números agora.

**Recomendação:**
- Pré-preenher Etapa 1 com valores realistas defaults (PV=300k, n=360, i=11.49%, TR=0)
- Permitir pular direto para resultado em 1 clique ("Usar valores padrão")
- Etapas 2-3 são opcionais (só se quiser puxar dados CAIXA reais)
- O onboarding de 4 etapas deveria ser: **uma tela** com todos os campos visíveis

#### 3.2 "Simular pela Caixa" está escondido demais
**Problema:** O botão FAB "Simular pela Caixa" fica no canto inferior direito do InputPanel. É o diferencial do produto (integração com API oficial) mas está no nível visual de um botão secundário.

**Recomendação:**
- Fazer um CTA primário no topo do painel: "⚡ Simular com dados reais da Caixa"
- Ou um banner destacado explicando o valor: "Preencha uma vez e compare com taxas reais"

#### 3.3 Gráfico principal sem contexto de leitura
**Problema:** O gráfico de "Evolução do saldo devedor" mostra 3 linhas (Price, SAC, Personalizado) mas:
- Sem Y-axis title claro
- Sem tooltip mostrando valores absolutos por mês (só hover geral)
- "k" no eixo Y é ambíguo (milhares? Não fica claro que é R$)

**Recomendação:**
- Y-axis label: "Saldo devedor (R$)"
- Tooltip ao hover: mostrar valor formatado (R$ XXX.XXX) + mês
- Anotar marcos importantes: "Saldo zera no mês X"
- Linha de referência horizontal em R$ 0 (quitado)

---

### 🟡 MÉDIA Prioridade

#### 3.4 Cards comparativos (KPI) — hierarquia confusa
**Problemo:** A tabela SAC/Price/Personalizado mostra:
- Juros totais (3 valores)
- Custo total (3 valores)
- Prazo real (3 valores)
- Economia de prazo (3 valores)

Problemas:
1. **SAC e Price são calculados com os mesmos parâmetros** — isso é redundante para quem já sabe qual sistema quer
2. "Economia de prazo" só aparece se h eventos configurados — mas a pessoa pode não entender POR QUE está zerado
3. Destaque verde de "winner" só funciona se hasEvents=true — confuso

**Recomendação:**
- Só mostrar a coluna "Personalizado" se houver eventos configurados
- Ou: tornar SAC/Price colapsáveis (accordion) para reduzir ruído
- Explicar em texto: "Configure aportes para ver a comparação completa"
- Ou inverter: mostrar só o resultado do sistema escolhido + diferença vs alternativa

#### 3.5 Templates de aporte (CLT) — visual flat
**Problema:** Os botões "13º Salário", "Férias (1/3)", "Usar FGTS" estão em uma linha horizontal com mesmo peso visual de campos de input.

**Recomendação:**
- Cards selecionáveis com ícone + descrição curta
- Ao selecionar, mostrar preview do impacto: "Economiza R$ XX.XXX e Xm"
- Agrupar visualmente: "Aceleração com CLT" como subsection

#### 3.6 Input de salário (FGTS) está dentro de "Usar FGTS"
**Problema:** O campo "Seu salário bruto (Base de cálculo)" aparece após clicar "Usar FGTS", mas não fica claro que é pré-requisito.

**Recomendação:**
- Mostrar o input sempre (não condicional), com estado disabled até marcar FGTS
- Label clara: "Salário bruto — base para cálculo do FGTS"

#### 3.7 Tabela mês a mês — escondida por padrão
**Problema:** A tabela mais detalhada está colapsada. Para ver, precisa expandir. Mas muitos usuários querem ver os números.

**Recomendação:**
- Mostrar sempre as primeiras 12 linhas (1 ano) expandidas
- Botão "Ver tabela completa" para abrir scroll infinito ou modal
- Sticky header com nomes das colunas

#### 3.8 Sem empty states elaborados
**Problema:** "Nenhum aporte configurado. Adicione aportes para simular quitação antecipada." — texto plano, sem guia visual.

**Recomendação:**
- Ilustração/ícone deaportes vazios
- CTA direto: "Adicionar primeiro aporte" (botão primário)
- Preview do impacto potencial: "Um aporte de R$ 5.000/mês economiza ~R$ 120k em juros"

---

### 🟢 BAIXA Prioridade (Polish)

#### 3.9 Tooltips nos inputs são hover-only
Em mobile (touch), tooltip não funciona. Recomendação: tap para abrir tooltip, ou usar texto de ajuda abaixo do campo.

#### 3.10 Botão "Compartilhar" poderia ser mais informativo
Mostrar preview do link: "Link copiado inclui seus parâmetros" ou mostrar um toast com confirmação visual melhor.

#### 3.11 Feedback visual de loading
Quando altera inputs numéricos, há debounce de 400ms. Sem loading indicator, o usuário pode pensar que nada aconteceu.

#### 3.12 Cores de chart inconsistentes com cards
- Cards: SAC=blue, Price=orange, Personalizado=white
- Charts: Price=red, SAC=blue, Personalizado=green
- Dificulta mapeamento mental.

**Recomendação:** Unificar palette em todo o app.

---

## 4. Problemas de Acessibilidade

### 4.1 Contraste
- Textos `text-gray-500` em `bg-gray-900` — verificar WCAG AA (4.5:1)
- Textos `text-gray-600` em `bg-gray-950` — falha provável em AA

### 4.2 Focus states
- Inputs têm `focus-within:border-blue-500` mas botões toggle (SAC/Price) não têm focus ring visível
- Recomendação: `:focus-visible` com outline 2px

### 4.3 Touch targets
- Botões de remover (X) nos eventos: ~24px — abaixo dos 44px recomendados
- Ícones de info: ~16px — muito pequeno

### 4.4 Sem skip-link
Não há "Skip to content" para leitores de tela.

---

## 5. Problemas de Copy/Textos

| Local | Texto atual | Sugestão |
|-------|-------------|----------|
| KPICards | "Juros totais" | "Total de juros" (mais natural) |
| KPICards | "Custo total" | "Custo total do financiamento" |
| InputPanel | "DFI + admin" | "Seguro DFI + Administração" (ou tooltip mais claro) |
| EventList | "Aportes extras" | "Aportes extras e antecipações" |
| CaixaOnboarding | "Buscar simulação" | "Buscar taxas na Caixa" |

---

## 6. Resumo de Prioridades para Implementação

### Sprint 1 — Quick Wins (1-2 dias)
1. **Reduzir fricção do onboarding:** Pre-preenher tudo e mostrar resultado imediato
2. **Simular pela Caixa como CTA primário:** No topo, não escondido
3. **Cores unificar:** Charts e cards com mesma palette
4. **Contraste de textos:** Gray-500/600 → Gray-400 mínimo

### Sprint 2 — Dashboard Clarity (3-5 dias)
5. **Gráfico com Y-axis claro** + tooltip por mês + linha de referência
6. **KPI cards mais inteligentes:** Só mostrar o que importa
7. **Empty states com guia:** Template de aporte como CTA
8. **Tabela mais visível:** Primeiras 12 linhas expandidas

### Sprint 3 — Polimento (2-3 dias)
9. **Tooltips mobile-friendly**
10. **Touch targets 44px mínimo**
11. **Focus states visíveis**
12. **Loading indicators em inputs**

---

## 7. Screenshots Salvos

| Arquivo | Descrição |
|---------|-----------|
| `screenshot-main-dashboard.png` | Dashboard com simulação padrão (PV=300k, 360m, SAC) |

---

## 8. Referências de Design

- **Linear** — Limpeza, densidade controlada, hierarquia por espaçamento
- **Stripe Dashboard** — Charts com tooltips ricos e contexto
- **Notion** — Empty states com guias visuais
- **Caixa Econômica** — Trust signals e clareza em dados financeiros

---

## Nota do Agente de Implementação

Este documento é um guia de **o que** melhorar. A implementação técnica deve:
1. Usar o design system já existente (Tailwind + Geist + Recharts)
2. Manter a arquitetura de componentes atual (só refinar)
3. Testar com o fluxo real de usuário antes de considerar done
4. Verificar contraste com a ferramenta axe ou similar

O repositório está em `Documents/dev/web-sim-hab/finansim/`
