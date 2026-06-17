'use client'

import { useState, useEffect, useRef } from 'react'

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
  const [localValue, setLocalValue] = useState(() =>
    monetary ? monetaryFromNumber(Number(value)) : String(value)
  )
  const externalRef = useRef(String(value))
  const onChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const next = String(value)
    if (next !== externalRef.current) {
      externalRef.current = next
      setLocalValue(monetary ? monetaryFromNumber(Number(value)) : next)
    }
  }, [value, monetary])

  function handleChange(raw: string) {
    if (monetary) {
      const digits = raw.replace(/\D/g, '')
      const formatted = digits ? parseInt(digits, 10).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : ''
      setLocalValue(formatted)
      externalRef.current = digits
      // Defer parent update by one tick so Android IME composition ends before React re-renders
      clearTimeout(onChangeTimerRef.current!)
      onChangeTimerRef.current = setTimeout(() => onChange(digits), 0)
    } else {
      setLocalValue(raw)
      onChange(raw)
    }
  }

  function handleBlur() {
    if (monetary) return
    const num = parseFloat(localValue)
    if (isNaN(num)) return
    const clamped = max !== undefined && num > max ? max
                  : min !== undefined && num < min ? min
                  : num
    if (clamped !== num) {
      setLocalValue(String(clamped))
      onChange(String(clamped))
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
              className="text-gray-600 hover:text-gray-400 text-xs leading-none w-4 h-4 rounded-full border border-gray-600 hover:border-gray-400 flex items-center justify-center transition-colors"
              aria-label="Mais informações"
            >
              ?
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
          type={monetary ? 'tel' : type}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          min={monetary ? undefined : min}
          max={monetary ? undefined : max}
          step={monetary ? undefined : step}
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
