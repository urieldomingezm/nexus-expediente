type Hijo = Node | string | null | undefined | false

/** Crea un elemento. Todo texto entra como texto (nunca como HTML), así que los datos del usuario no pueden inyectar marcado. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  atributos?: Record<string, string | boolean | ((e: Event) => void) | undefined> | null,
  ...hijos: Hijo[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(atributos ?? {})) {
    if (v === undefined || v === false) continue
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v)
    else if (v === true) el.setAttribute(k, '')
    else el.setAttribute(k, v)
  }
  for (const c of hijos) if (c) el.append(c)
  return el
}

let contador = 0
export const uid = (p: string): string => `${p}-${++contador}`

/** Aplica `clase` a `el` cuando su ancho es menor a `corte` px. Devuelve cómo dejar de observar. */
export function estrecho(el: HTMLElement, clase = 'estrecho', corte = 560): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}
  const ro = new ResizeObserver((es) => {
    const w = es[0]?.contentRect.width ?? el.getBoundingClientRect().width
    if (w > 0) el.classList.toggle(clase, w < corte)
  })
  ro.observe(el)
  return () => ro.disconnect()
}

export const fechaLarga = (f: string, locale: string): string => {
  const [a, m, d] = f.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, d)))
}
