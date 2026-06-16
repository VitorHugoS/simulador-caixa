'use client'

import { useMemo } from 'react'
import { AppState, SimResult } from '../engine/types'
import { simular } from '../engine/simulation'

export function useSimulator(state: AppState): SimResult {
  return useMemo(() => simular(state.params, state.eventos), [state.params, state.eventos])
}
