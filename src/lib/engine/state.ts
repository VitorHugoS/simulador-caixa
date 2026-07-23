import { AppState, EventoAporte, Params, ModoEntrada } from './types'

export type AppAction =
  | { type: 'UPDATE_PARAM'; key: keyof Params; value: number | string }
  | { type: 'UPDATE_PARAMS'; payload: Partial<Params> }
  | { type: 'ADD_EVENTO'; payload: EventoAporte }
  | { type: 'ADD_EVENTOS'; payload: EventoAporte[] }
  | { type: 'REMOVE_EVENTO'; id: string }
  | { type: 'REMOVE_GRUPO'; grupoId: string }
  | { type: 'SET_OVERRIDE'; mes: number; payload: EventoAporte[] }
  | { type: 'SET_EVENTOS'; payload: EventoAporte[] }
  | { type: 'SET_MODO'; payload: ModoEntrada }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_PARAM':
      return { ...state, params: { ...state.params, [action.key]: action.value } }
    case 'UPDATE_PARAMS':
      return { ...state, params: { ...state.params, ...action.payload } }
    case 'ADD_EVENTO':
      return { ...state, eventos: [...state.eventos, action.payload] }
    case 'ADD_EVENTOS':
      return { ...state, eventos: [...state.eventos, ...action.payload] }
    case 'REMOVE_EVENTO':
      return { ...state, eventos: state.eventos.filter(e => e.id !== action.id) }
    case 'REMOVE_GRUPO':
      return { ...state, eventos: state.eventos.filter(e => e.grupoId !== action.grupoId) }
    case 'SET_OVERRIDE':
      return {
        ...state,
        eventos: [
          ...state.eventos.filter(e => !(e.mesInicio === action.mes && e.geradoPor === 'override')),
          ...action.payload
        ]
      }
    case 'SET_EVENTOS':
      return { ...state, eventos: action.payload }
    case 'SET_MODO':
      return { ...state, modo: action.payload }
    default:
      return state
  }
}
