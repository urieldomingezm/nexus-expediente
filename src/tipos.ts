/** Fecha calendario en formato `AAAA-MM-DD` (sin hora ni zona: evita desfases de un día). */
export type Fecha = string

/** Estado de un requisito en el expediente de una persona. */
export type Estado = 'pendiente' | 'entregado' | 'aprobado' | 'rechazado' | 'por_vencer' | 'vencido' | 'no_aplica'

/** Un documento que el expediente pide (por ejemplo «INE» o «Contrato firmado»). */
export interface Requisito {
  id: string
  nombre: string
  descripcion?: string
  /** `true` por omisión: cuenta para el avance. Los opcionales se muestran pero no restan. */
  obligatorio?: boolean
  /** Días que vale el documento desde que se entrega (por ejemplo 365). Sin valor, no vence. */
  vigenciaDias?: number
  /** Extensiones o tipos MIME aceptados: `['.pdf', 'image/*']`. Sin valor, acepta cualquiera. */
  tipos?: string[]
  /** Tamaño máximo en MB (10 por omisión). */
  tamanoMaxMb?: number
  /** Puestos a los que aplica. Sin valor, aplica a todos. */
  puestos?: string[]
  /** `false` si basta con entregarlo (queda aprobado sin revisión). `true` por omisión. */
  requiereRevision?: boolean
  /** Para agrupar en la lista: «Identificación», «Contratación»… */
  categoria?: string
}

/** Datos del archivo entregado. La librería no guarda el contenido: eso lo hace tu servidor. */
export interface Archivo {
  nombre: string
  /** Bytes. */
  tamano: number
  tipo?: string
  /** Dirección donde tu servidor lo sirve (opcional, para el enlace «Ver»). */
  url?: string
}

/** Lo que se sabe de un requisito de una persona. Se guarda en tu base de datos. */
export interface Documento {
  requisitoId: string
  archivo?: Archivo
  entregadoEn?: Fecha
  /** Fecha de vencimiento. Si no la pones y el requisito tiene `vigenciaDias`, se calcula. */
  venceEn?: Fecha
  revision?: 'pendiente' | 'aprobado' | 'rechazado'
  revisadoPor?: string
  revisadoEn?: Fecha
  /** Motivo del rechazo. */
  motivo?: string
  /** Marca el requisito como «no aplica» para esta persona. */
  noAplica?: boolean
}

export interface Persona {
  id: string
  nombre: string
  puesto?: string
}

export type TipoEvento = 'documento.subido' | 'documento.aprobado' | 'documento.rechazado' | 'documento.quitado'

/**
 * Evento que el expediente avisa en `alEvento`. Tiene la forma de un registro de auditoría
 * (quién, qué, cuándo, antes y después) para que puedas guardarlo tal cual en tu bitácora.
 */
export interface EventoExpediente {
  tipo: TipoEvento
  personaId: string
  requisitoId: string
  /** Momento del evento, ISO 8601 (UTC). */
  en: string
  actor?: string
  antes?: Documento
  despues?: Documento
  motivo?: string
}

export interface OpcionesFecha {
  /** «Hoy» como `AAAA-MM-DD`. Por omisión, la fecha local del navegador. Útil en pruebas y en el servidor. */
  hoy?: Fecha
  /** Días antes del vencimiento en que pasa a «por vencer» (30 por omisión). */
  diasAviso?: number
}

export interface Fila {
  requisito: Requisito
  documento?: Documento
  estado: Estado
  /** Fecha de vencimiento calculada, si la hay. */
  venceEn?: Fecha
  /** Días que faltan para vencer (negativo si ya venció). */
  dias?: number
  obligatorio: boolean
}

export interface ResumenPersona {
  persona: Persona
  filas: Fila[]
  /** Requisitos obligatorios que aplican. */
  total: number
  /** Obligatorios cumplidos (aprobados, por vencer o que no aplican). */
  cumplidos: number
  /** 0 a 100, entero. Sin obligatorios aplicables vale 100. */
  avance: number
  faltantes: Fila[]
  porRevisar: Fila[]
  vencidos: Fila[]
  porVencer: Fila[]
  completo: boolean
}
