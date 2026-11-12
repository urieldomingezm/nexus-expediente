import { beforeEach, describe, expect, it, vi } from 'vitest'
import { montarEquipo, montarExpediente, type Documento, type EventoExpediente, type Requisito } from 'nexus-expediente'

const HOY = '2026-11-12'
const requisitos: Requisito[] = [
  { id: 'ine', nombre: 'INE', tipos: ['.pdf'], categoria: 'Identificación' },
  { id: 'curp', nombre: 'CURP', requiereRevision: false },
  { id: 'carta', nombre: 'Carta', obligatorio: false },
]
const persona = { id: 'e-1', nombre: 'Laura Méndez', puesto: 'Analista' }
let el: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  el = document.createElement('div')
  document.body.append(el)
})
const raiz = () => el.firstElementChild!.shadowRoot!
const q = <T extends Element>(s: string) => raiz().querySelector<T>(s)!
const boton = (texto: string) =>
  [...raiz().querySelectorAll('button')].find((b) => b.getAttribute('aria-label')?.startsWith(texto) || b.textContent === texto)!
const espera = () => new Promise((r) => setTimeout(r, 0))
const archivo = (nombre = 'ine.pdf', tipo = 'application/pdf', contenido = 'x') => new File([contenido], nombre, { type: tipo })

function elegir(id: string, f: File): void {
  const entrada = q<HTMLInputElement>(`[data-requisito="${id}"] input[type=file]`)
  Object.defineProperty(entrada, 'files', { value: [f], configurable: true })
  entrada.dispatchEvent(new Event('change'))
}

describe('montarExpediente', () => {
  it('dibuja persona, avance y filas con su estado en texto', () => {
    montarExpediente(el, { persona, requisitos, documentos: [], hoy: HOY })
    expect(q('h2').textContent).toBe('Laura Méndez')
    expect(q<HTMLProgressElement>('progress').value).toBe(0)
    expect(raiz().textContent).toContain('0 de 2 documentos obligatorios')
    expect(raiz().querySelectorAll('.fila')).toHaveLength(3)
    expect(q('[data-requisito="ine"] .insignia').textContent).toContain('Pendiente')
    expect(raiz().textContent).toContain('Identificación')
  })

  it('no interpreta HTML de los datos', () => {
    montarExpediente(el, {
      persona: { id: '1', nombre: '<img src=x onerror=alert(1)>' },
      requisitos: [{ id: 'a', nombre: '<b>Hola</b>' }],
      documentos: [],
      hoy: HOY,
    })
    expect(raiz().querySelector('img')).toBeNull()
    expect(raiz().querySelector('b')).toBeNull()
    expect(q('h2').textContent).toBe('<img src=x onerror=alert(1)>')
  })

  it('sube un archivo, llama a alSubir, cambia el estado y emite el evento', async () => {
    const eventos: EventoExpediente[] = []
    const alSubir = vi.fn(async () => ({ archivo: { nombre: 'ine.pdf', tamano: 1, url: 'https://s3/ine' } }))
    montarExpediente(el, { persona, requisitos, documentos: [], hoy: HOY, actor: 'laura', alSubir, alEvento: (e) => eventos.push(e) })
    elegir('ine', archivo())
    await espera()
    expect(alSubir).toHaveBeenCalledOnce()
    expect(q('[data-requisito="ine"] .insignia').textContent).toContain('En revisión')
    expect(q<HTMLAnchorElement>('[data-requisito="ine"] a').href).toBe('https://s3/ine')
    expect(eventos).toHaveLength(1)
    expect(eventos[0]).toMatchObject({ tipo: 'documento.subido', personaId: 'e-1', requisitoId: 'ine', actor: 'laura' })
    expect(eventos[0].antes).toBeUndefined()
    expect(eventos[0].despues?.entregadoEn).toBe(HOY)
    expect(q('[aria-live]').textContent).toBe('INE: En revisión')
  })

  it('rechaza archivos de tipo, tamaño o vacío incorrecto sin llamar a alSubir', async () => {
    const alSubir = vi.fn()
    montarExpediente(el, { persona, requisitos, documentos: [], hoy: HOY, alSubir })
    elegir('ine', archivo('virus.exe', 'application/x-msdownload'))
    await espera()
    expect(q('[data-requisito="ine"] .err').textContent).toContain('tipo de archivo')
    elegir('ine', archivo('a.pdf', 'application/pdf', ''))
    await espera()
    expect(q('[data-requisito="ine"] .err').textContent).toContain('vacío')
    expect(alSubir).not.toHaveBeenCalled()
  })

  it('si alSubir falla, no cambia nada y avisa', async () => {
    const eventos: EventoExpediente[] = []
    montarExpediente(el, {
      persona,
      requisitos,
      documentos: [],
      hoy: HOY,
      alSubir: async () => {
        throw new Error('red')
      },
      alEvento: (e) => eventos.push(e),
    })
    elegir('ine', archivo())
    await espera()
    expect(q('[data-requisito="ine"] .insignia').textContent).toContain('Pendiente')
    expect(q('[data-requisito="ine"] [role=alert]').textContent).toContain('No se pudo')
    expect(eventos).toHaveLength(0)
  })

  it('un error en alEvento no rompe el expediente', async () => {
    montarExpediente(el, {
      persona,
      requisitos,
      documentos: [],
      hoy: HOY,
      alEvento: () => {
        throw new Error('x')
      },
    })
    elegir('ine', archivo())
    await espera()
    expect(q('[data-requisito="ine"] .insignia').textContent).toContain('En revisión')
  })

  it('quien revisa aprueba y rechaza con motivo; sin permiso no ve los botones', async () => {
    const entregado: Documento[] = [
      { requisitoId: 'ine', archivo: { nombre: 'ine.pdf', tamano: 1 }, entregadoEn: HOY, revision: 'pendiente' },
    ]
    montarExpediente(el, { persona, requisitos, documentos: entregado, hoy: HOY })
    expect(boton('Aprobar')).toBeUndefined()

    const eventos: EventoExpediente[] = []
    const alRevisar = vi.fn(async () => {})
    const c = montarExpediente(el, {
      persona,
      requisitos,
      documentos: entregado,
      hoy: HOY,
      puedeRevisar: true,
      actor: 'rrhh',
      alRevisar,
      alEvento: (e) => eventos.push(e),
    })
    boton('Rechazar').click()
    boton('Rechazar documento').click()
    expect(q('[role=alert]').textContent).toContain('motivo')
    q<HTMLInputElement>('input[type=text]').value = 'Foto borrosa'
    boton('Rechazar documento').click()
    await espera()
    expect(alRevisar).toHaveBeenCalledWith(expect.objectContaining({ decision: 'rechazado', motivo: 'Foto borrosa' }))
    expect(q('[data-requisito="ine"] .insignia').textContent).toContain('Rechazado')
    expect(q('[data-requisito="ine"] .meta').textContent).toContain('Foto borrosa')
    expect(eventos.at(-1)).toMatchObject({ tipo: 'documento.rechazado', motivo: 'Foto borrosa', actor: 'rrhh' })

    c.actualizar(entregado)
    boton('Aprobar').click()
    await espera()
    expect(q('[data-requisito="ine"] .insignia').textContent).toContain('Aprobado')
    expect(c.resumen().cumplidos).toBe(1)
    expect(eventos.at(-1)?.tipo).toBe('documento.aprobado')
  })

  it('Esc cancela el rechazo y devuelve el foco', () => {
    const entregado: Documento[] = [
      { requisitoId: 'ine', archivo: { nombre: 'ine.pdf', tamano: 1 }, entregadoEn: HOY, revision: 'pendiente' },
    ]
    montarExpediente(el, { persona, requisitos, documentos: entregado, hoy: HOY, puedeRevisar: true })
    boton('Rechazar').click()
    q<HTMLInputElement>('input[type=text]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(raiz().querySelector('input[type=text]')).toBeNull()
    expect(boton('Rechazar')).toBeDefined()
  })

  it('quitar un documento lo deja pendiente y lo avisa', async () => {
    const eventos: EventoExpediente[] = []
    const alQuitar = vi.fn(async () => {})
    montarExpediente(el, {
      persona,
      requisitos,
      documentos: [{ requisitoId: 'curp', archivo: { nombre: 'c.pdf', tamano: 1 }, entregadoEn: HOY }],
      hoy: HOY,
      alQuitar,
      alEvento: (e) => eventos.push(e),
    })
    expect(q('[data-requisito="curp"] .insignia').textContent).toContain('Aprobado')
    boton('Quitar').click()
    await espera()
    expect(alQuitar).toHaveBeenCalledOnce()
    expect(q('[data-requisito="curp"] .insignia').textContent).toContain('Pendiente')
    expect(eventos[0].tipo).toBe('documento.quitado')
  })

  it('el filtro muestra solo lo que falta', () => {
    montarExpediente(el, { persona, requisitos, documentos: [{ requisitoId: 'curp', archivo: { nombre: 'c.pdf', tamano: 1 } }], hoy: HOY })
    const sel = q<HTMLSelectElement>('select')
    sel.value = 'faltantes'
    sel.dispatchEvent(new Event('change'))
    expect([...raiz().querySelectorAll('.fila')].map((f) => f.getAttribute('data-requisito'))).toEqual(['ine'])
    q<HTMLSelectElement>('select').value = 'revisar'
    q<HTMLSelectElement>('select').dispatchEvent(new Event('change'))
    expect(raiz().textContent).toContain('No hay documentos que mostrar.')
  })

  it('con todo cumplido dice «Expediente completo»; el tema y los textos se aplican', () => {
    montarExpediente(el, {
      persona,
      requisitos: [requisitos[1]],
      documentos: [{ requisitoId: 'curp', archivo: { nombre: 'c.pdf', tamano: 1 } }],
      hoy: HOY,
      tema: 'oscuro',
      textos: { completo: 'Todo listo', estados: { aprobado: 'Listo' } },
    })
    expect(raiz().textContent).toContain('Todo listo')
    expect(q('.insignia').textContent).toContain('Listo')
    expect(el.firstElementChild!.getAttribute('data-tema')).toBe('oscuro')
  })

  it('sin permiso de subir no hay botones de subir; destruir limpia', () => {
    const c = montarExpediente(el, { persona, requisitos, documentos: [], hoy: HOY, puedeSubir: false })
    expect(raiz().querySelector('input[type=file]')).toBeNull()
    c.destruir()
    expect(el.childElementCount).toBe(0)
  })
})

describe('montarEquipo', () => {
  const personas = [
    { id: 'a', nombre: 'Ana', puesto: 'Chofer' },
    { id: 'b', nombre: 'Álvaro', puesto: 'Analista' },
    { id: 'c', nombre: 'Carla' },
  ]
  const docs = { c: [{ requisitoId: 'curp', archivo: { nombre: 'c.pdf', tamano: 1 } }] }
  const filas = () => [...raiz().querySelectorAll('tbody tr')]

  it('muestra al equipo de menor a mayor avance', () => {
    montarEquipo(el, { personas, requisitos: [requisitos[1]], documentos: docs, hoy: HOY })
    expect(filas().map((f) => f.querySelector('td')!.textContent)).toEqual(['Álvaro', 'Ana', 'Carla'])
  })

  it('busca sin importar acentos y mayúsculas, y avisa si nadie coincide', () => {
    montarEquipo(el, { personas, requisitos: [requisitos[1]], documentos: docs, hoy: HOY })
    const busca = q<HTMLInputElement>('input[type=search]')
    busca.value = 'alvaro'
    busca.dispatchEvent(new Event('input'))
    expect(filas()).toHaveLength(1)
    q<HTMLInputElement>('input[type=search]').value = 'zzz'
    q<HTMLInputElement>('input[type=search]').dispatchEvent(new Event('input'))
    expect(q('[role=status]').textContent).toContain('Nadie')
  })

  it('invierte el orden, abre a la persona y exporta el CSV', () => {
    const alAbrir = vi.fn()
    const alExportar = vi.fn()
    montarEquipo(el, { personas, requisitos: [requisitos[1]], documentos: docs, hoy: HOY, alAbrir, alExportar })
    q<HTMLButtonElement>('[data-orden]').click()
    expect(filas().map((f) => f.querySelector('td')!.textContent)).toEqual(['Carla', 'Ana', 'Álvaro'])
    expect(q('th[aria-sort]').getAttribute('aria-sort')).toBe('descending')
    boton('Abrir expediente de Carla').click()
    expect(alAbrir).toHaveBeenCalledWith(personas[2])
    boton('Exportar CSV').click()
    expect(alExportar.mock.calls[0][0]).toContain('Persona,Puesto')
  })

  it('actualizar vuelve a calcular', () => {
    const c = montarEquipo(el, { personas, requisitos: [requisitos[1]], documentos: {}, hoy: HOY })
    expect(c.resumen().every((r) => r.avance === 0)).toBe(true)
    c.actualizar(docs)
    expect(c.resumen().find((r) => r.persona.id === 'c')?.avance).toBe(100)
  })
})
