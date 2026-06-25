'use client'

import { useState, useEffect, useRef } from 'react'
import { InfoIcon } from '@/components/ui/icons'

interface Props {
  label: string
  tooltip?: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  prefix?: string
  suffix?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  monetary?: boolean
}

function formatMonetary(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function monetaryFromNumber(n: number): string {
  if (!n) return ''
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

export function InputField({
  label,
  tooltip,
  value,
  onChange,
  type = 'number',
  prefix,
  suffix,
  placeholder,
  min,
  max,
  step,
  monetary = false,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Enquanto o campo está focado, o usuário é "dono" do valor.
  // Só sincronizamos com o prop `value` quando o campo está desfocado,
  // evitando o conflito de autocomplete / re-render no meio da digitação.
  const isFocusedRef = useRef(false)

  const formattedExternal = monetary
    ? monetaryFromNumber(Number(value))
    : String(value)

  const [localValue, setLocalValue] = useState(formattedExternal)

  // Sincroniza com o parent apenas quando não está sendo editado
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(formattedExternal)
    }
  }, [formattedExternal])

  function handleFocus() {
    isFocusedRef.current = true
  }

  function handleChange(raw: string) {
    if (monetary) {
      const digits = raw.replace(/\D/g, '')
      const formatted = digits
        ? parseInt(digits, 10).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
        : ''
      setLocalValue(formatted)
      // Para monetário, atualiza em tempo real (o valor é só dígitos, sem conflito de formato)
      onChange(digits)
    } else {
      // Para campos numéricos (taxa, prazo, etc.), apenas atualiza local.
      // O parent só recebe o valor no blur, evitando o "cabo de guerra"
      // que acontece quando o usuário digita e o React re-formata imediatamente.
      setLocalValue(raw)
    }
  }

  function handleBlur() {
    isFocusedRef.current = false

    if (monetary) return

    const trimmed = localValue.trim()

    if (trimmed === '' || trimmed === '-') {
      // Campo vazio: propaga 0 e restaura o display
      onChange('0')
      setLocalValue('0')
      return
    }

    // Usa vírgula como separador decimal (comum no mobile BR)
    const normalized = trimmed.replace(',', '.')
    const num = parseFloat(normalized)

    if (isNaN(num)) {
      // Valor inválido: volta para o que o parent tem
      setLocalValue(String(value))
      return
    }

    // Clampea dentro dos limites definidos
    const clamped =
      max !== undefined && num > max ? max
      : min !== undefined && num < min ? min
      : num

    const final = String(clamped)
    setLocalValue(final)
    onChange(final)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Confirma edição ao pressionar Enter (boa prática em formulários)
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <label className="text-sm text-gray-300 font-medium">{label}</label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="text-gray-600 hover:text-gray-400 w-4 h-4 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Mais informações"
            >
              <InfoIcon className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute top-6 left-0 z-50 w-56 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 shadow-xl">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
        {prefix && (
          <span className="px-3 text-gray-500 text-sm border-r border-gray-700 py-3">{prefix}</span>
        )}
        <input
          type={monetary ? 'tel' : type === 'number' ? 'text' : type}
          inputMode={type === 'number' || monetary ? 'decimal' : undefined}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 bg-transparent px-3 py-3 text-white text-sm outline-none placeholder-gray-600 min-w-0"
        />
        {suffix && (
          <span className="px-3 text-gray-500 text-sm border-l border-gray-700 py-3 whitespace-nowrap">{suffix}</span>
        )}
      </div>
    </div>
  )
}
