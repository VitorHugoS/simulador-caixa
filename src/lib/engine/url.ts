import { AppState, Params, DEFAULTS_SIMULAR } from './types'

export function encodeState(state: AppState): string {
  const p = state.params
  return new URLSearchParams({
    modo: state.modo,
    pv: String(p.pv),
    n: String(p.n),
    ia: String(p.iAnual),
    tr: String(p.trAnual),
    tf: String(p.taxasFixas),
    sis: p.sistema,
    mr: String(p.mipRate),
    fd: String(p.fgtsDeposito),
    ff: String(p.fgtsFrequencia),
  }).toString()
}

export function decodeParams(search: string): { modo: AppState['modo']; params: Params } {
  const p = new URLSearchParams(search)
  return {
    modo: (p.get('modo') === 'proposta' ? 'proposta' : 'simular') as AppState['modo'],
    params: {
      pv: parseFloat(p.get('pv') ?? '') || DEFAULTS_SIMULAR.pv,
      n: parseInt(p.get('n') ?? '') || DEFAULTS_SIMULAR.n,
      iAnual: parseFloat(p.get('ia') ?? '') || DEFAULTS_SIMULAR.iAnual,
      trAnual: parseFloat(p.get('tr') ?? '') || DEFAULTS_SIMULAR.trAnual,
      taxasFixas: parseFloat(p.get('tf') ?? '') || DEFAULTS_SIMULAR.taxasFixas,
      sistema: (p.get('sis') === 'price' ? 'price' : 'sac') as 'price' | 'sac',
      mipRate: parseFloat(p.get('mr') ?? '') || DEFAULTS_SIMULAR.mipRate,
      fgtsDeposito: parseFloat(p.get('fd') ?? '') || DEFAULTS_SIMULAR.fgtsDeposito,
      fgtsFrequencia: parseInt(p.get('ff') ?? '') || DEFAULTS_SIMULAR.fgtsFrequencia,
    },
  }
}
