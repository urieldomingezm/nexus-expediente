import { axe, expect, REQUISITOS, test } from './utilidades.mjs'

const HOY = '2026-11-12'
const PDF = { name: 'ine.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') }

/** Monta el expediente de Laura en la página y deja los eventos en window.eventos. */
const montar = (p, extra = {}) =>
  p.evaluate(
    ({ requisitos, hoy, extra }) => {
      window.eventos = []
      document.getElementById('raiz').replaceChildren()
      window.control = window.ex.montarExpediente(document.getElementById('raiz'), {
        persona: { id: 'e-17', nombre: 'Laura Méndez', puesto: 'Analista' },
        requisitos,
        documentos: [{ requisitoId: 'curp', archivo: { nombre: 'curp.pdf', tamano: 100 }, entregadoEn: hoy }],
        hoy,
        actor: 'rrhh',
        alEvento: (e) => window.eventos.push(e),
        ...extra,
      })
    },
    { requisitos: REQUISITOS, hoy: HOY, extra },
  )

const fila = (p, id) => p.locator(`[data-requisito="${id}"]`)

test.describe('expediente', () => {
  test('sube un documento: pasa a «En revisión», avisa y registra el evento', async ({ pagina: p }) => {
    await montar(p)
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('Pendiente')
    await fila(p, 'ine').locator('input[type=file]').setInputFiles(PDF)
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('En revisión')
    await expect(p.locator('[aria-live=polite]')).toHaveText('INE: En revisión')
    const e = await p.evaluate(() => window.eventos)
    expect(e).toHaveLength(1)
    expect(e[0]).toMatchObject({ tipo: 'documento.subido', personaId: 'e-17', requisitoId: 'ine', actor: 'rrhh' })
    await expect(p.getByText('1 de 3 documentos obligatorios')).toBeVisible()
  })

  test('rechaza un archivo de tipo no permitido', async ({ pagina: p }) => {
    await montar(p)
    await fila(p, 'contrato')
      .locator('input[type=file]')
      .setInputFiles({ name: 'a.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') })
    await expect(fila(p, 'contrato').getByRole('alert')).toContainText('tipo de archivo')
    await expect(fila(p, 'contrato').locator('.insignia')).toContainText('Pendiente')
  })

  test('RR. HH. rechaza con teclado y con motivo, y luego aprueba', async ({ pagina: p }) => {
    await montar(p, { puedeRevisar: true })
    await fila(p, 'ine').locator('input[type=file]').setInputFiles(PDF)
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('En revisión')

    await fila(p, 'ine')
      .getByRole('button', { name: /^Rechazar: INE/ })
      .focus()
    await p.keyboard.press('Enter')
    const motivo = fila(p, 'ine').getByLabel('Motivo del rechazo')
    await expect(motivo).toBeFocused()
    await p.keyboard.press('Enter')
    await expect(fila(p, 'ine').getByRole('alert')).toContainText('Escribe el motivo')
    await fila(p, 'ine').getByLabel('Motivo del rechazo').fill('Foto borrosa')
    await p.keyboard.press('Enter')
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('Rechazado')
    await expect(fila(p, 'ine')).toContainText('Foto borrosa')

    await fila(p, 'ine').locator('input[type=file]').setInputFiles(PDF)
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('En revisión')
    await fila(p, 'ine')
      .getByRole('button', { name: /^Aprobar: INE/ })
      .click()
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('Aprobado')
    const tipos = await p.evaluate(() => window.eventos.map((e) => e.tipo))
    expect(tipos).toEqual(['documento.subido', 'documento.rechazado', 'documento.subido', 'documento.aprobado'])
  })

  test('Esc cancela el rechazo y regresa el foco al botón', async ({ pagina: p }) => {
    await montar(p, { puedeRevisar: true })
    await fila(p, 'ine').locator('input[type=file]').setInputFiles(PDF)
    await fila(p, 'ine')
      .getByRole('button', { name: /^Rechazar: INE/ })
      .click()
    await p.keyboard.press('Escape')
    await expect(fila(p, 'ine').getByRole('button', { name: /^Rechazar: INE/ })).toBeFocused()
  })

  test('un documento vencido se ve «Vencido» aunque estuviera aprobado', async ({ pagina: p }) => {
    await montar(p, {
      documentos: [{ requisitoId: 'ine', archivo: { nombre: 'ine.pdf', tamano: 10 }, venceEn: '2026-11-01', revision: 'aprobado' }],
    })
    await expect(fila(p, 'ine').locator('.insignia')).toContainText('Vencido')
    await expect(fila(p, 'ine')).toContainText('Venció el')
  })

  for (const tema of ['claro', 'oscuro']) {
    test(`axe sin violaciones en tema ${tema}, con estados de todo tipo`, async ({ pagina: p }) => {
      await montar(p, {
        tema,
        puedeRevisar: true,
        documentos: [
          { requisitoId: 'curp', archivo: { nombre: 'curp.pdf', tamano: 100 }, entregadoEn: HOY },
          { requisitoId: 'ine', archivo: { nombre: 'ine.pdf', tamano: 100 }, entregadoEn: HOY, revision: 'pendiente' },
          { requisitoId: 'contrato', archivo: { nombre: 'c.pdf', tamano: 100 }, venceEn: '2026-11-01', revision: 'aprobado' },
          {
            requisitoId: 'carta',
            archivo: { nombre: 'carta.pdf', tamano: 100 },
            entregadoEn: HOY,
            revision: 'rechazado',
            motivo: 'Ilegible',
          },
        ],
      })
      await expect(fila(p, 'ine')).toBeVisible()
      expect(await axe(p)).toEqual([])
      await fila(p, 'ine')
        .getByRole('button', { name: /^Rechazar: INE/ })
        .click()
      expect(await axe(p)).toEqual([])
    })
  }

  test('en celular no hay desborde horizontal y todo se alcanza', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 360, height: 740 })
    await montar(p, { puedeRevisar: true })
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
    await expect(fila(p, 'contrato').getByRole('button', { name: /^Subir: Contrato/ })).toBeVisible()
  })

  test('el texto de los datos no se interpreta como HTML', async ({ pagina: p }) => {
    await montar(p, { persona: { id: 'x', nombre: '<img src=x onerror="window.hackeado=1">' } })
    await expect(p.getByRole('heading', { level: 2 })).toHaveText('<img src=x onerror="window.hackeado=1">')
    expect(await p.evaluate(() => window.hackeado)).toBeUndefined()
  })
})
