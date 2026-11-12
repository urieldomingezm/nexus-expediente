import type { Estado } from './tipos'

/** Textos de la interfaz (español de México). Cambia los que quieras con la opción `textos`. `{x}` se reemplaza por el valor. */
export interface Textos {
  estados: Record<Estado, string>
  avance: string
  obligatorio: string
  opcional: string
  subir: string
  reemplazar: string
  quitar: string
  ver: string
  aprobar: string
  rechazar: string
  motivo: string
  confirmarRechazo: string
  cancelar: string
  mostrar: string
  filtros: { todos: string; faltantes: string; porRevisar: string; vencidos: string }
  vence: string
  vencio: string
  completo: string
  resumen: string
  sinRequisitos: string
  errores: { tipo: string; tamano: string; vacio: string; fallo: string; motivoVacio: string }
  anuncio: string
  equipo: {
    persona: string
    puesto: string
    avance: string
    faltan: string
    vencidos: string
    buscar: string
    exportar: string
    sinResultados: string
    abrir: string
  }
}

export const TEXTOS_ES: Textos = {
  estados: {
    pendiente: 'Pendiente',
    entregado: 'En revisión',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    por_vencer: 'Por vencer',
    vencido: 'Vencido',
    no_aplica: 'No aplica',
  },
  avance: 'Avance del expediente',
  obligatorio: 'Obligatorio',
  opcional: 'Opcional',
  subir: 'Subir',
  reemplazar: 'Reemplazar',
  quitar: 'Quitar',
  ver: 'Ver',
  aprobar: 'Aprobar',
  rechazar: 'Rechazar',
  motivo: 'Motivo del rechazo',
  confirmarRechazo: 'Rechazar documento',
  cancelar: 'Cancelar',
  mostrar: 'Mostrar',
  filtros: { todos: 'Todos', faltantes: 'Faltantes', porRevisar: 'Por revisar', vencidos: 'Vencidos y por vencer' },
  vence: 'Vence el {fecha}',
  vencio: 'Venció el {fecha}',
  completo: 'Expediente completo',
  resumen: '{cumplidos} de {total} documentos obligatorios',
  sinRequisitos: 'No hay documentos que mostrar.',
  errores: {
    tipo: 'Ese tipo de archivo no se acepta aquí.',
    tamano: 'El archivo pesa más de {mb} MB.',
    vacio: 'El archivo está vacío.',
    fallo: 'No se pudo completar la acción. Intenta de nuevo.',
    motivoVacio: 'Escribe el motivo del rechazo.',
  },
  anuncio: '{documento}: {estado}',
  equipo: {
    persona: 'Persona',
    puesto: 'Puesto',
    avance: 'Avance',
    faltan: 'Faltan',
    vencidos: 'Vencidos',
    buscar: 'Buscar persona',
    exportar: 'Exportar CSV',
    sinResultados: 'Nadie coincide con la búsqueda.',
    abrir: 'Abrir expediente de {nombre}',
  },
}

export const llenar = (texto: string, valores: Record<string, string | number>): string =>
  texto.replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? ''))

export type TextosParciales = {
  [K in keyof Textos]?: Textos[K] extends string ? string : Partial<Textos[K]>
}

export function unirTextos(extra?: TextosParciales): Textos {
  if (!extra) return TEXTOS_ES
  const t = structuredClone(TEXTOS_ES) as Textos & Record<string, unknown>
  for (const [k, v] of Object.entries(extra)) {
    const actual = t[k]
    if (v && typeof v === 'object' && actual && typeof actual === 'object') Object.assign(actual, v)
    else if (v !== undefined) t[k] = v
  }
  return t
}
