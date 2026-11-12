import { describe, expect, it } from 'vitest'
// @ts-expect-error plugin .mjs sin tipos
import { limpiarEnlaces } from '../../site/plugin-docs.mjs'

const SITIO = 'https://urieldomingezm.github.io/nexus-expediente'

describe('limpiarEnlaces', () => {
  it('quita .html de los enlaces relativos y conserva el ancla', () => {
    const r = limpiarEnlaces('<a href="ejemplos.html">E</a> <a href="guia.html#1-instalación">G</a> <a href="api.html">A</a>', SITIO)
    expect(r).toBe('<a href="ejemplos">E</a> <a href="guia#1-instalación">G</a> <a href="api">A</a>')
  })

  it('la portada vuelve a la raíz', () => {
    expect(limpiarEnlaces('<a href="index.html">I</a><a href="index.html#modulos">M</a>', SITIO)).toBe(
      '<a href="./">I</a><a href="./#modulos">M</a>',
    )
  })

  it('también las direcciones absolutas del propio sitio', () => {
    const r = limpiarEnlaces(`<a href="${SITIO}/migracion.html">M</a> <a href="${SITIO}/index.html">I</a>`, SITIO)
    expect(r).toBe(`<a href="${SITIO}/migracion">M</a> <a href="${SITIO}/">I</a>`)
  })

  it('no toca enlaces de otros sitios, archivos en carpetas ni otros atributos', () => {
    const e =
      '<a href="https://example.com/x.html">X</a><a href="./assets/a.html">A</a><link rel="canonical" href="https://otro.dev/p.html" /><a href="guia.html" class="x">G</a>'
    expect(limpiarEnlaces(e, SITIO)).toBe(e.replace('href="guia.html"', 'href="guia"'))
  })
})
