// Lógica pura del expediente: sin DOM, sin red. Se usa igual en el navegador y en el servidor (por ejemplo en tu API de Nest).
import type { Documento, Estado, Fecha, Fila, OpcionesFecha, Persona, Requisito, ResumenPersona } from './tipos'

const DIA = 86_400_000
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

/** `AAAA-MM-DD` de hoy según el reloj local. */
export function hoyLocal(ahora: Date = new Date()): Fecha {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`
}

function aMs(f: Fecha): number {
  const m = FECHA.exec(f)
  if (!m) throw new Error(`Fecha inválida «${f}»: usa AAAA-MM-DD`)
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3])
  const d = new Date(ms)
  if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) throw new Error(`Fecha inexistente «${f}»`)
  return ms
}

/** Suma (o resta, si es negativo) días calendario a una fecha. */
export function sumarDias(f: Fecha, dias: number): Fecha {
  return new Date(aMs(f) + dias * DIA).toISOString().slice(0, 10)
}

/** Días de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: Fecha, hasta: Fecha): number {
  return Math.round((aMs(hasta) - aMs(desde)) / DIA)
}

const sinTilde = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/** Los requisitos que aplican a un puesto (los que no indican puestos aplican a todos). */
export function requisitosDe(requisitos: readonly Requisito[], puesto?: string): Requisito[] {
  const p = puesto ? sinTilde(puesto) : ''
  return requisitos.filter((r) => !r.puestos?.length || (p !== '' && r.puestos.some((x) => sinTilde(x) === p)))
}

/** Fecha en que vence el documento: la que traiga, o la entrega más la vigencia del requisito. */
export function venceEnDe(req: Requisito, doc?: Documento): Fecha | undefined {
  if (!doc?.archivo) return undefined
  if (doc.venceEn) return doc.venceEn
  return req.vigenciaDias && doc.entregadoEn ? sumarDias(doc.entregadoEn, req.vigenciaDias) : undefined
}

/** Estado de un requisito. Un documento vencido siempre se ve como vencido, aunque estuviera aprobado. */
export function estadoDe(req: Requisito, doc: Documento | undefined, o: OpcionesFecha = {}): Estado {
  if (doc?.noAplica) return 'no_aplica'
  if (!doc?.archivo) return 'pendiente'
  const hoy = o.hoy ?? hoyLocal()
  const vence = venceEnDe(req, doc)
  const dias = vence ? diasEntre(hoy, vence) : undefined
  if (dias !== undefined && dias < 0) return 'vencido'
  if (doc.revision === 'rechazado') return 'rechazado'
  if (req.requiereRevision !== false && doc.revision !== 'aprobado') return 'entregado'
  if (dias !== undefined && dias <= (o.diasAviso ?? 30)) return 'por_vencer'
  return 'aprobado'
}

/** ¿Este estado cuenta como requisito cumplido? */
export const cumple = (e: Estado): boolean => e === 'aprobado' || e === 'por_vencer' || e === 'no_aplica'

/** Una fila por requisito aplicable, con su estado y su vencimiento. */
export function filasDe(
  requisitos: readonly Requisito[],
  documentos: readonly Documento[],
  o: OpcionesFecha = {},
  puesto?: string,
): Fila[] {
  const hoy = o.hoy ?? hoyLocal()
  const porId = new Map(documentos.map((d) => [d.requisitoId, d]))
  return requisitosDe(requisitos, puesto).map((requisito) => {
    const documento = porId.get(requisito.id)
    const venceEn = venceEnDe(requisito, documento)
    return {
      requisito,
      documento,
      estado: estadoDe(requisito, documento, { ...o, hoy }),
      venceEn,
      dias: venceEn ? diasEntre(hoy, venceEn) : undefined,
      obligatorio: requisito.obligatorio !== false,
    }
  })
}

/** Avance y pendientes de una persona. Solo los obligatorios cuentan para el porcentaje. */
export function resumenPersona(
  persona: Persona,
  requisitos: readonly Requisito[],
  documentos: readonly Documento[],
  o: OpcionesFecha = {},
): ResumenPersona {
  const filas = filasDe(requisitos, documentos, o, persona.puesto)
  const obligatorias = filas.filter((f) => f.obligatorio && f.estado !== 'no_aplica')
  const cumplidos = obligatorias.filter((f) => cumple(f.estado)).length
  const total = obligatorias.length
  return {
    persona,
    filas,
    total,
    cumplidos,
    avance: total === 0 ? 100 : Math.round((cumplidos / total) * 100),
    faltantes: filas.filter((f) => f.obligatorio && (f.estado === 'pendiente' || f.estado === 'rechazado')),
    porRevisar: filas.filter((f) => f.estado === 'entregado'),
    vencidos: filas.filter((f) => f.estado === 'vencido'),
    porVencer: filas.filter((f) => f.estado === 'por_vencer'),
    completo: total === cumplidos,
  }
}

/** Resumen de un equipo, de menor a mayor avance (a quien más le falta, primero). */
export function resumenEquipo(
  personas: readonly Persona[],
  requisitos: readonly Requisito[],
  documentos: Readonly<Record<string, readonly Documento[]>>,
  o: OpcionesFecha = {},
): ResumenPersona[] {
  return personas
    .map((p) => resumenPersona(p, requisitos, documentos[p.id] ?? [], o))
    .sort((a, b) => a.avance - b.avance || a.persona.nombre.localeCompare(b.persona.nombre, 'es'))
}

export interface ResultadoArchivo {
  ok: boolean
  /** Motivo cuando `ok` es falso. */
  motivo?: 'tipo' | 'tamano' | 'vacio'
}

/** Revisa tipo y tamaño de un archivo contra el requisito (el servidor debe volver a revisarlo). */
export function validarArchivo(req: Requisito, archivo: { nombre: string; tamano: number; tipo?: string }): ResultadoArchivo {
  if (archivo.tamano <= 0) return { ok: false, motivo: 'vacio' }
  if (archivo.tamano > (req.tamanoMaxMb ?? 10) * 1024 * 1024) return { ok: false, motivo: 'tamano' }
  if (req.tipos?.length) {
    const nombre = archivo.nombre.toLowerCase()
    const tipo = (archivo.tipo ?? '').toLowerCase()
    const bien = req.tipos.some((t) => {
      const x = t.toLowerCase().trim()
      if (x.startsWith('.')) return nombre.endsWith(x)
      if (x.endsWith('/*')) return tipo.startsWith(x.slice(0, -1))
      return tipo === x
    })
    if (!bien) return { ok: false, motivo: 'tipo' }
  }
  return { ok: true }
}

/** Celda de CSV: comillas dobles, y un apóstrofo al inicio si empezaría con = + - @ (para que Excel no lo ejecute como fórmula). */
const celda = (v: string | number): string => {
  const t = String(v)
  const seguro = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t
  return /[",\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

/** CSV del resumen del equipo (con BOM para que Excel abra bien los acentos). */
export function aCsv(resumenes: readonly ResumenPersona[]): string {
  const filas = [
    ['Persona', 'Puesto', 'Avance (%)', 'Cumplidos', 'Total', 'Faltan', 'Por revisar', 'Vencidos', 'Por vencer', 'Documentos que faltan'],
  ]
  for (const r of resumenes) {
    filas.push([
      r.persona.nombre,
      r.persona.puesto ?? '',
      String(r.avance),
      String(r.cumplidos),
      String(r.total),
      String(r.faltantes.length),
      String(r.porRevisar.length),
      String(r.vencidos.length),
      String(r.porVencer.length),
      [...r.faltantes, ...r.vencidos].map((f) => f.requisito.nombre).join('; '),
    ])
  }
  return `\uFEFF${filas.map((f) => f.map(celda).join(',')).join('\r\n')}\r\n`
}
