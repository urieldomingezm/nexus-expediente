import type { Documento, Persona, Requisito } from 'nexus-expediente'

/** Datos de muestra. Las fechas son relativas a hoy para que el ejemplo siempre muestre los distintos estados. */
export const REQUISITOS: Requisito[] = [
  { id: 'ine', nombre: 'INE', descripcion: 'Por ambos lados, legible.', tipos: ['.pdf', 'image/*'], vigenciaDias: 3650, categoria: 'Identificación' },
  { id: 'curp', nombre: 'CURP', tipos: ['.pdf'], requiereRevision: false, categoria: 'Identificación' },
  { id: 'contrato', nombre: 'Contrato firmado', tipos: ['.pdf'], categoria: 'Contratación' },
  { id: 'constancia', nombre: 'Constancia de situación fiscal', tipos: ['.pdf'], vigenciaDias: 90, categoria: 'Contratación' },
  { id: 'licencia', nombre: 'Licencia de conducir', tipos: ['.pdf', 'image/*'], vigenciaDias: 1095, puestos: ['Chofer'] },
  { id: 'carta', nombre: 'Carta de recomendación', obligatorio: false },
]

const dia = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const arch = (nombre: string) => ({ nombre, tamano: 184_320 })

export const LAURA: Persona = { id: 'e-17', nombre: 'Laura Méndez', puesto: 'Analista' }
export const DOCS_LAURA: Documento[] = [
  { requisitoId: 'ine', archivo: arch('ine-laura.pdf'), entregadoEn: dia(-20), revision: 'aprobado' },
  { requisitoId: 'curp', archivo: arch('curp.pdf'), entregadoEn: dia(-20) },
  { requisitoId: 'constancia', archivo: arch('constancia-sat.pdf'), entregadoEn: dia(-75), revision: 'aprobado' },
]

export const EQUIPO: Persona[] = [
  LAURA,
  { id: 'e-21', nombre: 'Carlos Ruiz', puesto: 'Chofer' },
  { id: 'e-30', nombre: 'Ana Sofía Torres', puesto: 'Analista' },
  { id: 'e-33', nombre: 'Álvaro Pérez', puesto: 'Chofer' },
]
export const DOCS_EQUIPO: Record<string, Documento[]> = {
  'e-17': DOCS_LAURA,
  'e-21': [
    { requisitoId: 'ine', archivo: arch('ine.pdf'), entregadoEn: dia(-400), revision: 'aprobado' },
    { requisitoId: 'curp', archivo: arch('curp.pdf'), entregadoEn: dia(-400) },
    { requisitoId: 'contrato', archivo: arch('contrato.pdf'), entregadoEn: dia(-400), revision: 'aprobado' },
    { requisitoId: 'constancia', archivo: arch('constancia.pdf'), entregadoEn: dia(-100), revision: 'aprobado' },
    { requisitoId: 'licencia', archivo: arch('licencia.pdf'), entregadoEn: dia(-1080), revision: 'aprobado' },
  ],
  'e-30': [
    { requisitoId: 'ine', archivo: arch('ine.pdf'), entregadoEn: dia(-5), revision: 'aprobado' },
    { requisitoId: 'curp', archivo: arch('curp.pdf'), entregadoEn: dia(-5) },
    { requisitoId: 'contrato', archivo: arch('contrato.pdf'), entregadoEn: dia(-4), revision: 'aprobado' },
    { requisitoId: 'constancia', archivo: arch('constancia.pdf'), entregadoEn: dia(-3), revision: 'aprobado' },
  ],
  'e-33': [],
}
