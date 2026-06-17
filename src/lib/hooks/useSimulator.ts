'use client'

import { useMemo } from 'react'
import { AppState, SimResult } from '../engine/types'
import { simularBaselines, simularPersonalizado } from '../engine/simulation'

export function useSimulator(state: AppState): SimResult {
  const { pv, n, iAnual, taxasFixas, mipRate, fgtsFrequencia } = state.params

  const baselines = useMemo(
    () => simularBaselines(state.params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pv, n, iAnual, taxasFixas, mipRate, fgtsFrequencia],
  )

  const personalizado = useMemo(
    () => simularPersonalizado(state.params, state.eventos),
    [state.params, state.eventos],
  )

  return useMemo(
    () => ({ ...baselines, personalizado }),
    [baselines, personalizado],
  )
}
