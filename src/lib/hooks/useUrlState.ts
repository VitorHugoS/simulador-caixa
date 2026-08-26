'use client'

import { useEffect, useRef, useReducer, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppState, EventoAporte, DEFAULTS_SIMULAR } from '../engine/types'
import { encodeState, decodeParams } from '../engine/url'
import { appReducer } from '../engine/state'

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

  // Run initializer only once
  const [initialState] = useState<AppState>(() => {
    const search = searchParams.toString()
    if (!search) {
      return { modo: 'simular', params: DEFAULTS_SIMULAR, eventos: loadEventos() }
    }
    const { modo, params } = decodeParams(search)
    return { modo, params, eventos: loadEventos() }
  })

  const [state, dispatch] = useReducer(appReducer, initialState)

  // Infrastructure side-effects (Adapter)
  useEffect(() => {
    saveEventos(state.eventos)
  }, [state.eventos])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const encoded = encodeState(state)
      router.replace(`${pathname}?${encoded}`, { scroll: false })
    }, 300)
  }, [state, pathname, router])

  return { state, dispatch, hasUrlState }
}
