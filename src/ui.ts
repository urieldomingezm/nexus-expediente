import { aCsv, hoyLocal, resumenEquipo, resumenPersona, validarArchivo } from './motor'
import { h, estrecho, fechaLarga, uid } from './dom'
import { ESTILOS_CSS } from './estilos'
import { llenar, unirTextos, type Textos, type TextosParciales } from './textos'
import type { Archivo, Documento, Estado, EventoExpediente, Fila, Persona, Requisito, ResumenPersona, TipoEvento } from './tipos'

const GLIFO: Record<Estado, string> = {
  pendiente: '○',
  entregado: '◔',
  aprobado: '✓',
  rechazado: '✕',
  por_vencer: '!',
  vencido: '✕',
  no_aplica: '–',
}

interface Comunes {
  /** «Hoy» como AAAA-MM-DD (por omisión, la fecha local). */
  hoy?: string
  diasAviso?: number
  /** Idioma de las fechas: `es-MX` por omisión. */
  locale?: string
  textos?: TextosParciales
  tema?: 'auto' | 'claro' | 'oscuro'
}

export interface OpcionesExpediente extends Comunes {
  persona: Persona
  requisitos: Requisito[]
  documentos: Documento[]
  /** Si la persona puede subir y quitar documentos. `true` por omisión. */
  puedeSubir?: boolean
  /** Si quien mira puede aprobar o rechazar. `false` por omisión. */
  puedeRevisar?: boolean
  /** Quién hace la acción; viaja en los eventos y en `revisadoPor`. */
  actor?: string
  /**
   * Se llama con el archivo ya validado. Guárdalo en tu servidor (S3…) y, si quieres, devuelve datos extra del documento
   * (por ejemplo `{ archivo: { …, url } }`). Si lanza un error, el documento no cambia y se avisa en pantalla.
   */
  alSubir?: (a: { persona: Persona; requisito: Requisito; archivo: File }) => Promise<Partial<Documento> | void>
  alRevisar?: (a: { persona: Persona; requisito: Requisito; decision: 'aprobado' | 'rechazado'; motivo?: string }) => Promise<void>
  alQuitar?: (a: { persona: Persona; requisito: Requisito }) => Promise<void>
  /** Avisa cada cambio con la forma de un registro de auditoría. */
  alEvento?: (e: EventoExpediente) => void
}

export interface ControlExpediente {
  elemento: HTMLElement
  /** Reemplaza los documentos (por ejemplo después de pedirlos de nuevo al servidor). */
  actualizar(documentos: Documento[]): void
  resumen(): ResumenPersona
  destruir(): void
}

function preparar(destino: HTMLElement, o: Comunes): { raiz: HTMLElement; sombra: ShadowRoot; texto: Textos; quitar: () => void } {
  const anfitrion = h('div')
  const sombra = anfitrion.attachShadow({ mode: 'open' })
  if (o.tema && o.tema !== 'auto') anfitrion.setAttribute('data-tema', o.tema)
  const raiz = h('div', { class: 'raiz' })
  sombra.append(h('style', null, ESTILOS_CSS), raiz)
  destino.replaceChildren(anfitrion)
  return { raiz, sombra, texto: unirTextos(o.textos), quitar: estrecho(raiz) }
}

/** Expediente de una persona: lista de documentos con estado, avance, subida y revisión. */
export function montarExpediente(destino: HTMLElement, o: OpcionesExpediente): ControlExpediente {
  const { raiz, texto: t, quitar } = preparar(destino, o)
  const hoy = o.hoy ?? hoyLocal()
  const locale = o.locale ?? 'es-MX'
  const opts = { hoy, diasAviso: o.diasAviso }
  const subir = o.puedeSubir !== false
  let docs = [...o.documentos]
  let filtro: 'todos' | 'faltantes' | 'revisar' | 'vencidos' = 'todos'
  let rechazando: string | null = null
  let ocupado: string | null = null
  const errores = new Map<string, string>()
  const aviso = h('div', { class: 'sr', 'aria-live': 'polite' })
  const idFiltro = uid('filtro')

  const resumen = () => resumenPersona(o.persona, o.requisitos, docs, opts)
  const docDe = (id: string) => docs.find((d) => d.requisitoId === id)
  const guardar = (d: Documento | undefined, id: string) => {
    docs = docs.filter((x) => x.requisitoId !== id)
    if (d) docs.push(d)
  }
  const emitir = (tipo: TipoEvento, requisitoId: string, antes?: Documento, despues?: Documento, motivo?: string) => {
    try {
      o.alEvento?.({ tipo, personaId: o.persona.id, requisitoId, en: new Date().toISOString(), actor: o.actor, antes, despues, motivo })
    } catch {
      /* un error en tu gancho no debe romper el expediente */
    }
  }
  const estadoTexto = (id: string) => {
    const f = resumen().filas.find((x) => x.requisito.id === id)
    return f ? t.estados[f.estado] : ''
  }

  async function ejecutar(id: string, accion: () => Promise<void>, foco: string): Promise<void> {
    ocupado = id
    errores.delete(id)
    pintar()
    try {
      await accion()
      aviso.textContent = llenar(t.anuncio, { documento: o.requisitos.find((r) => r.id === id)?.nombre ?? '', estado: estadoTexto(id) })
    } catch {
      errores.set(id, t.errores.fallo)
    } finally {
      ocupado = null
      pintar()
      raiz.querySelector<HTMLElement>(`[data-foco="${CSS.escape(`${id}:${foco}`)}"]`)?.focus()
    }
  }

  async function recibir(fila: Fila, file: File): Promise<void> {
    const r = fila.requisito
    const archivo: Archivo = { nombre: file.name, tamano: file.size, ...(file.type ? { tipo: file.type } : {}) }
    const v = validarArchivo(r, archivo)
    if (!v.ok) {
      errores.set(
        r.id,
        v.motivo === 'tipo'
          ? t.errores.tipo
          : v.motivo === 'tamano'
            ? llenar(t.errores.tamano, { mb: r.tamanoMaxMb ?? 10 })
            : t.errores.vacio,
      )
      pintar()
      return
    }
    await ejecutar(
      r.id,
      async () => {
        const extra = (await o.alSubir?.({ persona: o.persona, requisito: r, archivo: file })) ?? {}
        const antes = docDe(r.id)
        const despues: Documento = { requisitoId: r.id, archivo, entregadoEn: hoy, revision: 'pendiente', ...extra }
        guardar(despues, r.id)
        emitir('documento.subido', r.id, antes, despues)
      },
      'subir',
    )
  }

  async function revisar(fila: Fila, decision: 'aprobado' | 'rechazado', motivo?: string): Promise<void> {
    const r = fila.requisito
    await ejecutar(
      r.id,
      async () => {
        await o.alRevisar?.({ persona: o.persona, requisito: r, decision, motivo })
        const antes = docDe(r.id)
        const despues: Documento = {
          ...(antes as Documento),
          revision: decision,
          revisadoPor: o.actor,
          revisadoEn: hoy,
          motivo: decision === 'rechazado' ? motivo : undefined,
        }
        guardar(despues, r.id)
        rechazando = null
        emitir(decision === 'aprobado' ? 'documento.aprobado' : 'documento.rechazado', r.id, antes, despues, motivo)
      },
      decision === 'aprobado' ? 'aprobar' : 'rechazar',
    )
  }

  async function quitarDoc(fila: Fila): Promise<void> {
    const r = fila.requisito
    await ejecutar(
      r.id,
      async () => {
        await o.alQuitar?.({ persona: o.persona, requisito: r })
        const antes = docDe(r.id)
        guardar(undefined, r.id)
        emitir('documento.quitado', r.id, antes, undefined)
      },
      'subir',
    )
  }

  function acciones(fila: Fila): HTMLElement {
    const r = fila.requisito
    const id = r.id
    const bloqueado = ocupado === id
    const botones: Node[] = []
    if (fila.documento?.archivo?.url) {
      botones.push(
        h(
          'a',
          {
            class: 'enlace',
            href: fila.documento.archivo.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            'aria-label': `${t.ver}: ${r.nombre}`,
          },
          t.ver,
        ),
      )
    }
    if (subir && fila.estado !== 'no_aplica') {
      const aceptar = r.tipos?.join(',')
      const entrada = h('input', { type: 'file', hidden: true, tabindex: '-1', accept: aceptar, 'aria-hidden': 'true' })
      entrada.addEventListener('change', () => {
        const f = entrada.files?.[0]
        if (f) void recibir(fila, f)
      })
      const tiene = !!fila.documento?.archivo
      botones.push(
        entrada,
        h(
          'button',
          {
            type: 'button',
            class: tiene ? '' : 'p',
            'data-foco': `${id}:subir`,
            disabled: bloqueado,
            'aria-label': `${tiene ? t.reemplazar : t.subir}: ${r.nombre}`,
            onclick: () => entrada.click(),
          },
          tiene ? t.reemplazar : t.subir,
        ),
      )
      if (tiene) {
        botones.push(
          h(
            'button',
            { type: 'button', disabled: bloqueado, 'aria-label': `${t.quitar}: ${r.nombre}`, onclick: () => void quitarDoc(fila) },
            t.quitar,
          ),
        )
      }
    }
    if (o.puedeRevisar && fila.estado === 'entregado') {
      botones.push(
        h(
          'button',
          {
            type: 'button',
            class: 'p',
            'data-foco': `${id}:aprobar`,
            disabled: bloqueado,
            'aria-label': `${t.aprobar}: ${r.nombre}`,
            onclick: () => void revisar(fila, 'aprobado'),
          },
          t.aprobar,
        ),
        h(
          'button',
          {
            type: 'button',
            'data-foco': `${id}:rechazar`,
            disabled: bloqueado,
            'aria-label': `${t.rechazar}: ${r.nombre}`,
            onclick: () => (
              (rechazando = id),
              errores.delete(id),
              pintar(),
              raiz.querySelector<HTMLInputElement>(`[data-foco="${CSS.escape(`${id}:motivo`)}"]`)?.focus()
            ),
          },
          t.rechazar,
        ),
      )
    }
    return h('div', { class: 'acciones' }, ...botones)
  }

  function formularioRechazo(fila: Fila): HTMLElement {
    const id = fila.requisito.id
    const campo = h('input', { type: 'text', id: uid('motivo'), 'data-foco': `${id}:motivo`, maxlength: '300', autocomplete: 'off' })
    const etiqueta = h('label', { for: campo.id }, t.motivo)
    const confirmar = () => {
      const motivo = campo.value.trim()
      if (!motivo) {
        errores.set(id, t.errores.motivoVacio)
        pintar()
        raiz.querySelector<HTMLInputElement>(`[data-foco="${CSS.escape(`${id}:motivo`)}"]`)?.focus()
        return
      }
      void revisar(fila, 'rechazado', motivo)
    }
    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        confirmar()
      } else if (e.key === 'Escape') {
        rechazando = null
        pintar()
        raiz.querySelector<HTMLElement>(`[data-foco="${CSS.escape(`${id}:rechazar`)}"]`)?.focus()
      }
    })
    return h(
      'div',
      { class: 'rechazo' },
      etiqueta,
      campo,
      h(
        'div',
        { class: 'acciones' },
        h('button', { type: 'button', class: 'p', onclick: confirmar }, t.confirmarRechazo),
        h(
          'button',
          {
            type: 'button',
            onclick: () => (
              (rechazando = null),
              pintar(),
              raiz.querySelector<HTMLElement>(`[data-foco="${CSS.escape(`${id}:rechazar`)}"]`)?.focus()
            ),
          },
          t.cancelar,
        ),
      ),
    )
  }

  function tarjeta(fila: Fila): HTMLElement {
    const r = fila.requisito
    const meta: string[] = []
    if (fila.documento?.archivo) meta.push(fila.documento.archivo.nombre)
    if (fila.venceEn) meta.push(llenar((fila.dias ?? 0) < 0 ? t.vencio : t.vence, { fecha: fechaLarga(fila.venceEn, locale) }))
    if (fila.estado === 'rechazado' && fila.documento?.motivo) meta.push(fila.documento.motivo)
    return h(
      'li',
      { class: 'fila', 'data-requisito': r.id },
      h(
        'div',
        { class: 'fila-cab' },
        h('span', { class: 'nombre' }, r.nombre, h('small', null, fila.obligatorio ? t.obligatorio : t.opcional)),
        h('span', { class: `insignia e-${fila.estado}` }, h('span', { 'aria-hidden': 'true' }, GLIFO[fila.estado]), t.estados[fila.estado]),
      ),
      r.descripcion && h('p', { class: 'desc' }, r.descripcion),
      meta.length ? h('p', { class: 'meta' }, meta.join(' · ')) : null,
      errores.has(r.id) && h('p', { class: 'err', role: 'alert' }, errores.get(r.id)),
      rechazando === r.id ? formularioRechazo(fila) : acciones(fila),
    )
  }

  function pasa(f: Fila): boolean {
    if (filtro === 'faltantes') return f.obligatorio && (f.estado === 'pendiente' || f.estado === 'rechazado')
    if (filtro === 'revisar') return f.estado === 'entregado'
    if (filtro === 'vencidos') return f.estado === 'vencido' || f.estado === 'por_vencer'
    return true
  }

  function pintar(): void {
    const r = resumen()
    const barra = h('progress', { max: '100', value: String(r.avance), 'aria-label': t.avance })
    const grupos = new Map<string, Fila[]>()
    for (const f of r.filas.filter(pasa)) {
      const c = f.requisito.categoria ?? ''
      grupos.set(c, [...(grupos.get(c) ?? []), f])
    }
    const lista = h('div')
    for (const [cat, filas] of grupos) {
      if (cat) lista.append(h('h3', { class: 'cat' }, cat))
      lista.append(h('ul', null, ...filas.map(tarjeta)))
    }
    if (!grupos.size) lista.append(h('p', { class: 'vacio' }, t.sinRequisitos))
    const sel = h(
      'select',
      {
        id: idFiltro,
        onchange: (e) => (
          (filtro = (e.target as HTMLSelectElement).value as typeof filtro),
          pintar(),
          raiz.querySelector<HTMLElement>(`#${idFiltro}`)?.focus()
        ),
      },
      ...(['todos', 'faltantes', 'revisar', 'vencidos'] as const).map((v) => {
        const op = h(
          'option',
          { value: v },
          v === 'todos'
            ? t.filtros.todos
            : v === 'faltantes'
              ? t.filtros.faltantes
              : v === 'revisar'
                ? t.filtros.porRevisar
                : t.filtros.vencidos,
        )
        if (v === filtro) op.selected = true
        return op
      }),
    )
    raiz.replaceChildren(
      h(
        'div',
        { class: 'cab' },
        h('div', { class: 'persona' }, h('h2', null, o.persona.nombre), o.persona.puesto && h('span', null, o.persona.puesto)),
        h(
          'div',
          { class: 'avance' },
          h(
            'div',
            { class: 'avance-fila' },
            h('span', null, r.completo ? t.completo : llenar(t.resumen, { cumplidos: r.cumplidos, total: r.total })),
            h('strong', null, `${r.avance}%`),
          ),
          barra,
        ),
        h('div', { class: 'filtro' }, h('label', { for: idFiltro }, t.mostrar), sel),
      ),
      lista,
      aviso,
    )
  }

  pintar()
  return {
    elemento: raiz,
    actualizar(nuevos) {
      docs = [...nuevos]
      pintar()
    },
    resumen,
    destruir() {
      quitar()
      destino.replaceChildren()
    },
  }
}

export interface OpcionesEquipo extends Comunes {
  personas: Persona[]
  requisitos: Requisito[]
  /** Documentos de cada persona, por `persona.id`. */
  documentos: Record<string, Documento[]>
  /** Se llama al elegir a una persona (para abrir su expediente). */
  alAbrir?: (p: Persona) => void
  /** Recibe el CSV en lugar de descargarlo. */
  alExportar?: (csv: string) => void
}

export interface ControlEquipo {
  elemento: HTMLElement
  actualizar(documentos: Record<string, Documento[]>): void
  resumen(): ResumenPersona[]
  destruir(): void
}

/** Vista de equipo: a quién le falta qué, de menor a mayor avance, con búsqueda y exportación a CSV. */
export function montarEquipo(destino: HTMLElement, o: OpcionesEquipo): ControlEquipo {
  const { raiz, texto: t, quitar } = preparar(destino, o)
  const opts = { hoy: o.hoy ?? hoyLocal(), diasAviso: o.diasAviso }
  let docs = o.documentos
  let busca = ''
  let asc = true
  const idBusca = uid('busca')

  const datos = () => resumenEquipo(o.personas, o.requisitos, docs, opts)
  const visibles = () => {
    const q = busca
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    const todos = datos().filter(
      (r) =>
        !q ||
        `${r.persona.nombre} ${r.persona.puesto ?? ''}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(q),
    )
    return asc ? todos : [...todos].reverse()
  }

  function exportar(): void {
    const csv = aCsv(visibles())
    if (o.alExportar) return o.alExportar(csv)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = h('a', { href: url, download: 'expedientes.csv' })
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function pintar(): void {
    const filas = visibles()
    const busqueda = h('input', { type: 'search', id: idBusca, autocomplete: 'off', value: busca })
    busqueda.addEventListener('input', () => {
      busca = busqueda.value
      const pos = busqueda.selectionStart
      pintar()
      const nuevo = raiz.querySelector<HTMLInputElement>(`#${idBusca}`)
      nuevo?.focus()
      if (pos !== null) nuevo?.setSelectionRange(pos, pos)
    })
    const orden = h(
      'button',
      {
        type: 'button',
        onclick: () => ((asc = !asc), pintar(), raiz.querySelector<HTMLElement>('[data-orden]')?.focus()),
        'data-orden': '',
      },
      `${t.equipo.avance} ${asc ? '↑' : '↓'}`,
    )
    const cuerpo = filas.map((r) =>
      h(
        'tr',
        null,
        h(
          'td',
          { 'data-et': t.equipo.persona },
          o.alAbrir
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'nom-btn',
                  'aria-label': llenar(t.equipo.abrir, { nombre: r.persona.nombre }),
                  onclick: () => o.alAbrir?.(r.persona),
                },
                r.persona.nombre,
              )
            : r.persona.nombre,
        ),
        h('td', { 'data-et': t.equipo.puesto }, r.persona.puesto ?? '—'),
        h(
          'td',
          { 'data-et': t.equipo.avance },
          h('progress', { max: '100', value: String(r.avance), 'aria-label': `${t.equipo.avance}: ${r.persona.nombre}` }),
          h('span', { class: 'num' }, `${r.avance}%`),
        ),
        h('td', { class: 'num', 'data-et': t.equipo.faltan }, String(r.faltantes.length)),
        h('td', { class: 'num', 'data-et': t.equipo.vencidos }, String(r.vencidos.length)),
      ),
    )
    const tabla = h(
      'table',
      { class: 'tabla-eq' },
      h('caption', { class: 'sr' }, t.avance),
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          h('th', { scope: 'col' }, t.equipo.persona),
          h('th', { scope: 'col' }, t.equipo.puesto),
          h('th', { scope: 'col', 'aria-sort': asc ? 'ascending' : 'descending' }, orden),
          h('th', { scope: 'col' }, t.equipo.faltan),
          h('th', { scope: 'col' }, t.equipo.vencidos),
        ),
      ),
      h('tbody', null, ...cuerpo),
    )
    raiz.replaceChildren(
      h(
        'div',
        { class: 'barra' },
        h('div', { class: 'campo' }, h('label', { for: idBusca }, t.equipo.buscar), busqueda),
        h('button', { type: 'button', onclick: exportar }, t.equipo.exportar),
      ),
      filas.length ? tabla : h('p', { class: 'vacio', role: 'status' }, t.equipo.sinResultados),
    )
  }

  pintar()
  return {
    elemento: raiz,
    actualizar(nuevos) {
      docs = nuevos
      pintar()
    },
    resumen: datos,
    destruir() {
      quitar()
      destino.replaceChildren()
    },
  }
}
