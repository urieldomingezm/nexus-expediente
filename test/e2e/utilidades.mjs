// Utilidades compartidas por las pruebas de punta a punta (Playwright Test).
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export { expect }
export const PAGINA = '/test/paginas/'

/** Violaciones de axe (reglas WCAG 2.x A/AA) de lo que hay en la página. */
export async function axe(page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
}

/** Abre la página de pruebas y falla si la página lanza errores. */
export const test = base.extend({
  pagina: async ({ page }, use) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(PAGINA)
    await page.waitForFunction(() => window.ex)
    await use(page)
    expect(errores, 'errores de JavaScript en la página').toEqual([])
  },
})

export const REQUISITOS = [
  { id: 'ine', nombre: 'INE', tipos: ['.pdf', 'image/*'], vigenciaDias: 3650, categoria: 'Identificación' },
  { id: 'curp', nombre: 'CURP', tipos: ['.pdf'], requiereRevision: false, categoria: 'Identificación' },
  { id: 'contrato', nombre: 'Contrato firmado', tipos: ['.pdf'], categoria: 'Contratación' },
  { id: 'carta', nombre: 'Carta de recomendación', obligatorio: false },
]
