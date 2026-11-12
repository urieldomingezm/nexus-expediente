import './comun'
import { montarEquipo, montarExpediente, type EventoExpediente } from 'nexus-expediente'
import { DOCS_EQUIPO, DOCS_LAURA, EQUIPO, LAURA, REQUISITOS } from './datos-demo'

const $ = (id: string) => document.getElementById(id)!

montarExpediente($('demo-persona'), { persona: LAURA, requisitos: REQUISITOS, documentos: DOCS_LAURA })

const eventos: EventoExpediente[] = []
const salida = $('bitacora-salida').querySelector('code')!
montarExpediente($('demo-revision'), {
  persona: LAURA,
  requisitos: REQUISITOS,
  documentos: [...DOCS_LAURA, { requisitoId: 'contrato', archivo: { nombre: 'contrato-laura.pdf', tamano: 220_000 }, entregadoEn: new Date().toISOString().slice(0, 10), revision: 'pendiente' }],
  puedeRevisar: true,
  actor: 'rrhh@empresa.mx',
  alEvento: (e) => {
    eventos.unshift(e)
    salida.textContent = JSON.stringify(eventos.slice(0, 3), null, 2)
  },
})

montarEquipo($('demo-equipo'), { personas: EQUIPO, requisitos: REQUISITOS, documentos: DOCS_EQUIPO, alAbrir: (p) => ($('equipo-abre').textContent = `Aquí abrirías el expediente de ${p.nombre}.`) })

montarExpediente($('demo-oscuro'), { persona: LAURA, requisitos: REQUISITOS.slice(0, 3), documentos: DOCS_LAURA, tema: 'oscuro' })
