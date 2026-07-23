import { EventoAporte, Params, EfeitoAporte } from './types'
import { gerarSACTransform } from './events'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export class CenarioBuilder {
  private eventos: EventoAporte[] = []

  constructor(private params: Params) {}

  comSACTransform(): this {
    const sacEventos = gerarSACTransform(this.params)
    this.eventos.push(...sacEventos)
    return this
  }

  comAporte(aporte: { 
    mesInicio: number; 
    mesFim?: number; 
    frequencia?: number; 
    valor: number; 
    efeito: EfeitoAporte; 
    fgts?: boolean; 
    override?: boolean 
  }): this {
    this.eventos.push({
      id: uid(),
      mesInicio: aporte.mesInicio,
      mesFim: aporte.mesFim,
      frequencia: aporte.frequencia || 1,
      valor: aporte.valor,
      efeito: aporte.efeito,
      fgts: aporte.fgts || false,
      geradoPor: aporte.override ? 'override' : 'lote',
      grupoId: uid(),
    })
    return this
  }
  
  comEventosExistentes(eventos: EventoAporte[]): this {
    this.eventos.push(...eventos)
    return this
  }

  build(): EventoAporte[] {
    return [...this.eventos]
  }
}
