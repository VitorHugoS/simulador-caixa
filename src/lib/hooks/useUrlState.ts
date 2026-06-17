'use client'

import { useCallback, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppState, EventoAporte, DEFAULTS_SIMULAR } from '../engine/types'
import { encodeState, decodeParams } from '../engine/url'

const SESSION_KEY = 'finansim_eventos'

function loadEventos(): EventoAporte[] {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEventos(eventos: EventoAporte[]) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(eventos))
  } catch { /* storage full or SSR */ }
}

export function useUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasUrlState = searchParams.toString() !== ''

  const [state, setStateInternal] = useState<AppState>(() => {
    const search = searchParams.toString()
    if (!search) {
      return { modo: 'simular', params: DEFAULTS_SIMULAR, eventos: [] }
    }
    const { modo, params } = decodeParams(search)
    return { modo, params, eventos: loadEventos() }
  })

  const setState = useCallback((next: AppState | ((prev: AppState) => AppState)) => {
    setStateInternal((prev) => {
      const updated = typeof next === 'function' ? next(prev) : next

      // Persist events to localStorage immediately
      saveEventos(updated.eventos)

      // Debounce URL update (params only)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const encoded = encodeState(updated)
        router.replace(`${pathname}?${encoded}`, { scroll: false })
      }, 300)

      return updated
    })
  }, [router, pathname])

  return { state, setState, hasUrlState }
}
