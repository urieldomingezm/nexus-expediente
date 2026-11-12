// Comprueba en compilación que los tipos públicos se pueden usar como lo hace una aplicación.
import { montarExpediente, resumenPersona, type Documento, type EventoExpediente, type Requisito } from 'nexus-expediente'
import { estadoDe } from 'nexus-expediente/motor'

const requisitos: Requisito[] = [{ id: 'ine', nombre: 'INE', vigenciaDias: 3650, tipos: ['.pdf', 'image/*'] }]
const documentos: Documento[] = []
const eventos: EventoExpediente[] = []

export const r = resumenPersona({ id: '1', nombre: 'Laura' }, requisitos, documentos)
export const e = estadoDe(requisitos[0], undefined)
export const control = montarExpediente(document.body, {
  persona: { id: '1', nombre: 'Laura' },
  requisitos,
  documentos,
  alEvento: (ev) => eventos.push(ev),
})
