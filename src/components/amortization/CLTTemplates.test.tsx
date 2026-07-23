import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { CLTTemplates } from './CLTTemplates'
import { Params } from '@/lib/engine/types'

describe('CLTTemplates (UI Seam)', () => {
  const defaultParams: Params = {
    pv: 300000,
    n: 360,
    iAnual: 0.1,
    trAnual: 0,
    taxasFixas: 0,
    mipRate: 0,
    sistema: 'sac',
    fgtsDeposito: 0,
    fgtsFrequencia: 24,
  }

  afterEach(() => {
    cleanup()
  })

  it('deve exibir o campo de Salário Bruto visível desde o início (fluxo isolado)', () => {
    const onUpsert = vi.fn()
    const onRemove = vi.fn()
    const onUpdateParam = vi.fn()

    render(
      <CLTTemplates
        eventos={[]}
        params={defaultParams}
        onUpsert={onUpsert}
        onRemove={onRemove}
        onUpdateParam={onUpdateParam}
      />
    )

    // O input de salário deve estar na tela imediatamente para que o usuário não tenha que adivinhar.
    const inputSalario = screen.getByLabelText(/Seu salário bruto/i)
    expect(inputSalario).toBeDefined()
  })

  it('deve recalcular 8% do FGTS automaticamente quando o salário mudar e o FGTS estiver ativo', () => {
    const onUpsert = vi.fn()
    const onRemove = vi.fn()
    const onUpdateParam = vi.fn()

    const paramsComFgts = { ...defaultParams, fgtsDeposito: 400 }

    render(
      <CLTTemplates
        eventos={[]}
        params={paramsComFgts}
        onUpsert={onUpsert}
        onRemove={onRemove}
        onUpdateParam={onUpdateParam}
      />
    )

    const inputSalario = screen.getByLabelText(/Seu salário bruto/i)
    
    // Simula a mudança do salário para R$ 10.000
    // Como a formatação limpa para number, vamos colocar um raw text ou simular fireEvent
    // O InputField do projeto recebe onChange(raw) na prop, e no handleChange remove \D se monetary.
    // Mas via RTL a gente dispara onChange no input.
    fireEvent.change(inputSalario, { target: { value: '10000' } })

    // O onUpdateParam deve ter sido chamado para o fgtsDeposito
    expect(onUpdateParam).toHaveBeenCalledWith('fgtsDeposito', 800) // 10000 * 0.08 = 800
  })

  it('deve adicionar evento de 13º Salário ao clicar no toggle', () => {
    const onUpsert = vi.fn()
    const onRemove = vi.fn()
    const onUpdateParam = vi.fn()

    render(
      <CLTTemplates
        eventos={[]}
        params={defaultParams}
        onUpsert={onUpsert}
        onRemove={onRemove}
        onUpdateParam={onUpdateParam}
      />
    )

    const btn13 = screen.getByText('13º Salário')
    fireEvent.click(btn13)

    expect(onUpsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'template-13-salario',
      frequencia: 12,
      mesInicio: 12,
      // O Líquido exato deve ser chamado
      valor: expect.any(Number)
    }))
  })

  it('deve adicionar evento de Férias ao clicar no toggle', () => {
    const onUpsert = vi.fn()
    const onRemove = vi.fn()
    const onUpdateParam = vi.fn()

    render(
      <CLTTemplates
        eventos={[]}
        params={defaultParams}
        onUpsert={onUpsert}
        onRemove={onRemove}
        onUpdateParam={onUpdateParam}
      />
    )

    const btnFerias = screen.getByText('Férias (1/3)')
    fireEvent.click(btnFerias)

    expect(onUpsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'template-ferias',
      frequencia: 12,
      mesInicio: 6,
      valor: expect.any(Number)
    }))
  })
})
