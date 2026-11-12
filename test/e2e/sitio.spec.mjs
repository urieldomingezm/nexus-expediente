// Sitio de documentación (site/): todas las páginas cargan sin errores y las demostraciones funcionan de verdad.
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SITIO = '/site/'
const test = base.extend({
  pagina: async ({ page }, use) => {
    const errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await use(page)
    expect(errores, 'errores en la consola').toEqual([])
  },
})

test.describe('Sitio de documentación', () => {
  for (const [pagina, titulo] of [
    ['index.html', /nexus-expediente/],
    ['primeros-pasos.html', /Primeros pasos/],
    ['guia.html', /Guía/],
    ['ejemplos.html', /Ejemplos/],
    ['integracion.html', /Integración/],
    ['seguridad.html', /Seguridad/],
    ['novedades.html', /Novedades/],
    ['api.html', /API/],
  ]) {
    test(`${pagina} carga con cabecera, pie y sin errores`, async ({ pagina: p }) => {
      await p.goto(SITIO + pagina)
      await expect(p).toHaveTitle(titulo)
      await expect(p.locator('header.cabecera')).toBeVisible()
      await expect(p.locator('footer.pie')).toBeVisible()
      await expect(p.locator('h1')).toBeVisible()
    })
  }

  test('la portada muestra un expediente que sí funciona', async ({ pagina: p }) => {
    await p.goto(SITIO)
    const demo = p.locator('#demo-inicio')
    await expect(demo.getByRole('heading', { name: 'Laura Méndez' })).toBeVisible()
    await demo
      .locator('[data-requisito="contrato"] input[type=file]')
      .setInputFiles({ name: 'c.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') })
    await expect(demo.locator('[data-requisito="contrato"] .insignia')).toContainText('En revisión')
  })

  test('los ejemplos: la revisión alimenta la bitácora y el equipo se ordena', async ({ pagina: p }) => {
    await p.goto(SITIO + 'ejemplos.html')
    const rev = p.locator('#demo-revision')
    await rev.getByRole('button', { name: /^Aprobar: Contrato/ }).click()
    await expect(rev.locator('[data-requisito="contrato"] .insignia')).toContainText('Aprobado')
    await expect(p.locator('#bitacora-salida')).toContainText('documento.aprobado')
    const nombres = await p.locator('#demo-equipo tbody tr td:first-child').allInnerTexts()
    expect(nombres[0]).toBe('Álvaro Pérez')
    await p.getByRole('button', { name: 'Abrir expediente de Carlos Ruiz' }).click()
    await expect(p.locator('#equipo-abre')).toContainText('Carlos Ruiz')
  })

  test('el menú tiene submenús y el tema se recuerda', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 1280, height: 800 })
    await p.goto(SITIO)
    const empezar = p.locator('header.cabecera .grupo-btn', { hasText: 'Empezar' })
    await empezar.click()
    await expect(empezar).toHaveAttribute('aria-expanded', 'true')
    await expect(p.locator('header.cabecera').getByRole('link', { name: /Primeros pasos/ })).toBeVisible()
    await p.keyboard.press('Escape')
    await expect(empezar).toHaveAttribute('aria-expanded', 'false')
    const tema = p.locator('header.cabecera button[data-tema]')
    await tema.click()
    await tema.click()
    await expect(p.locator('html')).toHaveAttribute('data-tema', 'oscuro')
    await p.reload()
    await expect(p.locator('html')).toHaveAttribute('data-tema', 'oscuro')
  })

  for (const pagina of ['index.html', 'ejemplos.html', 'guia.html']) {
    test(`axe sin violaciones en ${pagina}`, async ({ pagina: p }) => {
      await p.goto(SITIO + pagina)
      await p.waitForLoadState('networkidle')
      const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    })
  }

  test('en celular el menú se abre y no hay desborde', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 390, height: 800 })
    await p.goto(SITIO)
    await p.locator('.menu-btn').click()
    await expect(p.locator('#menu-principal')).toBeVisible()
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
