import { axe, expect, REQUISITOS, test } from './utilidades.mjs'

const montar = (p, extra = {}) =>
  p.evaluate(
    ({ requisitos, extra }) => {
      window.csv = ''
      window.abierto = null
      document.getElementById('raiz').replaceChildren()
      window.ex.montarEquipo(document.getElementById('raiz'), {
        personas: [
          { id: 'a', nombre: 'Ana Torres', puesto: 'Chofer' },
          { id: 'b', nombre: 'Álvaro Pérez', puesto: 'Analista' },
          { id: 'c', nombre: 'Carla Ruiz', puesto: 'Analista' },
        ],
        requisitos,
        documentos: {
          c: [
            { requisitoId: 'ine', archivo: { nombre: 'a', tamano: 1 }, revision: 'aprobado' },
            { requisitoId: 'curp', archivo: { nombre: 'a', tamano: 1 } },
            { requisitoId: 'contrato', archivo: { nombre: 'a', tamano: 1 }, revision: 'aprobado' },
          ],
        },
        hoy: '2026-11-12',
        alAbrir: (p) => (window.abierto = p.id),
        alExportar: (csv) => (window.csv = csv),
        ...extra,
      })
    },
    { requisitos: REQUISITOS, extra },
  )

const nombres = (p) => p.locator('tbody tr td:first-child').allInnerTexts()

test.describe('vista de equipo', () => {
  test('ordena de menor a mayor avance, invierte, busca y abre', async ({ pagina: p }) => {
    await montar(p)
    expect(await nombres(p)).toEqual(['Álvaro Pérez', 'Ana Torres', 'Carla Ruiz'])
    await p.getByRole('button', { name: /^Avance/ }).click()
    expect(await nombres(p)).toEqual(['Carla Ruiz', 'Ana Torres', 'Álvaro Pérez'])
    await p.getByLabel('Buscar persona').fill('alvaro')
    expect(await nombres(p)).toEqual(['Álvaro Pérez'])
    await p.getByLabel('Buscar persona').fill('zzz')
    await expect(p.getByRole('status')).toContainText('Nadie')
    await p.getByLabel('Buscar persona').fill('carla')
    await p.getByRole('button', { name: 'Abrir expediente de Carla Ruiz' }).click()
    expect(await p.evaluate(() => window.abierto)).toBe('c')
  })

  test('el CSV trae BOM, encabezado y a quien le falta algo', async ({ pagina: p }) => {
    await montar(p)
    await p.getByRole('button', { name: 'Exportar CSV' }).click()
    const csv = await p.evaluate(() => window.csv)
    expect(csv.startsWith('﻿Persona,Puesto,Avance (%)')).toBe(true)
    expect(csv).toContain('Carla Ruiz,Analista,100')
    expect(csv).toContain('Contrato firmado')
  })

  test('descarga el CSV cuando no hay alExportar', async ({ pagina: p }) => {
    await montar(p, { alExportar: undefined })
    const descarga = p.waitForEvent('download')
    await p.getByRole('button', { name: 'Exportar CSV' }).click()
    expect((await descarga).suggestedFilename()).toBe('expedientes.csv')
  })

  for (const tema of ['claro', 'oscuro']) {
    test(`axe sin violaciones en tema ${tema}`, async ({ pagina: p }) => {
      await montar(p, { tema })
      await expect(p.locator('tbody tr')).toHaveCount(3)
      expect(await axe(p)).toEqual([])
    })
  }

  test('en celular las filas se vuelven tarjetas sin desborde', async ({ pagina: p }) => {
    await p.setViewportSize({ width: 360, height: 740 })
    await montar(p)
    await expect(p.locator('td[data-et="Persona"]').first()).toBeVisible()
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
    expect(await axe(p)).toEqual([])
  })
})
