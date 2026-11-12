import { describe, expect, it } from 'vitest'
import {
  aCsv,
  cumple,
  diasEntre,
  estadoDe,
  filasDe,
  hoyLocal,
  requisitosDe,
  resumenEquipo,
  resumenPersona,
  sumarDias,
  validarArchivo,
  venceEnDe,
} from 'nexus-expediente/motor'
import type { Documento, Requisito } from 'nexus-expediente'

const HOY = '2026-11-12'
const ine: Requisito = { id: 'ine', nombre: 'INE', vigenciaDias: 100 }
const curp: Requisito = { id: 'curp', nombre: 'CURP', requiereRevision: false }
const lic: Requisito = { id: 'lic', nombre: 'Licencia', puestos: ['Chofer'], obligatorio: true }
const extra: Requisito = { id: 'extra', nombre: 'Carta', obligatorio: false }
const arch = { nombre: 'a.pdf', tamano: 100 }

describe('fechas', () => {
  it('suma y resta días, incluso entre años y bisiestos', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(sumarDias('2026-11-12', -12)).toBe('2026-10-31')
  })
  it('cuenta días entre fechas', () => {
    expect(diasEntre('2026-11-12', '2026-11-22')).toBe(10)
    expect(diasEntre('2026-11-12', '2026-11-02')).toBe(-10)
  })
  it('rechaza fechas mal escritas o inexistentes', () => {
    expect(() => sumarDias('12/11/2026', 1)).toThrow(/AAAA-MM-DD/)
    expect(() => sumarDias('2026-02-30', 1)).toThrow(/inexistente/)
  })
  it('hoyLocal usa la fecha local', () => {
    expect(hoyLocal(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05')
  })
})

describe('estadoDe', () => {
  it('sin archivo está pendiente; no aplica gana', () => {
    expect(estadoDe(ine, undefined, { hoy: HOY })).toBe('pendiente')
    expect(estadoDe(ine, { requisitoId: 'ine', noAplica: true }, { hoy: HOY })).toBe('no_aplica')
  })
  it('con archivo espera revisión; aprobado y rechazado según la revisión', () => {
    const base: Documento = { requisitoId: 'ine', archivo: arch, entregadoEn: HOY }
    expect(estadoDe(ine, { ...base, revision: 'pendiente' }, { hoy: HOY })).toBe('entregado')
    expect(estadoDe(ine, { ...base, revision: 'aprobado' }, { hoy: HOY })).toBe('aprobado')
    expect(estadoDe(ine, { ...base, revision: 'rechazado' }, { hoy: HOY })).toBe('rechazado')
  })
  it('los requisitos sin revisión quedan aprobados al entregarse', () => {
    expect(estadoDe(curp, { requisitoId: 'curp', archivo: arch, entregadoEn: HOY }, { hoy: HOY })).toBe('aprobado')
  })
  it('por vencer dentro del aviso, vencido después, y vencido gana sobre aprobado y rechazado', () => {
    const doc = (venceEn: string, revision: Documento['revision'] = 'aprobado'): Documento => ({
      requisitoId: 'ine',
      archivo: arch,
      venceEn,
      revision,
    })
    expect(estadoDe(ine, doc('2026-12-12'), { hoy: HOY })).toBe('por_vencer')
    expect(estadoDe(ine, doc('2026-12-13'), { hoy: HOY })).toBe('aprobado')
    expect(estadoDe(ine, doc('2026-12-13'), { hoy: HOY, diasAviso: 40 })).toBe('por_vencer')
    expect(estadoDe(ine, doc('2026-11-12'), { hoy: HOY })).toBe('por_vencer')
    expect(estadoDe(ine, doc('2026-11-11'), { hoy: HOY })).toBe('vencido')
    expect(estadoDe(ine, doc('2026-11-11', 'rechazado'), { hoy: HOY })).toBe('vencido')
  })
  it('calcula el vencimiento con la vigencia del requisito', () => {
    expect(venceEnDe(ine, { requisitoId: 'ine', archivo: arch, entregadoEn: '2026-01-01' })).toBe('2026-04-11')
    expect(venceEnDe(ine, { requisitoId: 'ine', entregadoEn: '2026-01-01' })).toBeUndefined()
    expect(venceEnDe(curp, { requisitoId: 'curp', archivo: arch, entregadoEn: '2026-01-01' })).toBeUndefined()
  })
  it('cumple cuenta aprobado, por vencer y no aplica', () => {
    expect(['aprobado', 'por_vencer', 'no_aplica'].every((e) => cumple(e as never))).toBe(true)
    expect(['pendiente', 'entregado', 'rechazado', 'vencido'].some((e) => cumple(e as never))).toBe(false)
  })
})

describe('requisitos y resumen', () => {
  it('filtra por puesto sin importar acentos ni mayúsculas', () => {
    expect(requisitosDe([ine, lic], 'Analista').map((r) => r.id)).toEqual(['ine'])
    expect(requisitosDe([ine, lic], ' chofer ').map((r) => r.id)).toEqual(['ine', 'lic'])
    expect(requisitosDe([ine, lic]).map((r) => r.id)).toEqual(['ine'])
  })
  it('filasDe da vencimiento y días', () => {
    const [f] = filasDe([ine], [{ requisitoId: 'ine', archivo: arch, entregadoEn: '2026-11-02', revision: 'aprobado' }], { hoy: HOY })
    expect(f.venceEn).toBe('2027-02-10')
    expect(f.dias).toBe(90)
  })
  it('el avance cuenta solo obligatorios y reparte pendientes', () => {
    const docs: Documento[] = [
      { requisitoId: 'ine', archivo: arch, entregadoEn: HOY, revision: 'aprobado' },
      { requisitoId: 'curp', archivo: arch, entregadoEn: HOY },
    ]
    const r = resumenPersona({ id: '1', nombre: 'Laura', puesto: 'Chofer' }, [ine, curp, lic, extra], docs, { hoy: HOY })
    expect(r.total).toBe(3)
    expect(r.cumplidos).toBe(2)
    expect(r.avance).toBe(67)
    expect(r.faltantes.map((f) => f.requisito.id)).toEqual(['lic'])
    expect(r.completo).toBe(false)
  })
  it('sin obligatorios, el avance es 100; los no aplica no cuentan', () => {
    expect(resumenPersona({ id: '1', nombre: 'A' }, [extra], [], { hoy: HOY }).avance).toBe(100)
    const r = resumenPersona({ id: '1', nombre: 'A' }, [ine], [{ requisitoId: 'ine', noAplica: true }], { hoy: HOY })
    expect(r.total).toBe(0)
    expect(r.completo).toBe(true)
  })
  it('reparte por revisar, vencidos y por vencer', () => {
    const docs: Documento[] = [
      { requisitoId: 'ine', archivo: arch, venceEn: '2026-11-01', revision: 'aprobado' },
      { requisitoId: 'curp', archivo: arch, venceEn: '2026-11-20' },
    ]
    const r = resumenPersona({ id: '1', nombre: 'A' }, [ine, curp], docs, { hoy: HOY })
    expect(r.vencidos).toHaveLength(1)
    expect(r.porVencer).toHaveLength(1)
    const e = resumenPersona({ id: '1', nombre: 'A' }, [ine], [{ requisitoId: 'ine', archivo: arch, revision: 'pendiente' }], { hoy: HOY })
    expect(e.porRevisar).toHaveLength(1)
  })
  it('el equipo sale de menor a mayor avance y desempata por nombre', () => {
    const personas = [
      { id: 'b', nombre: 'Beto' },
      { id: 'a', nombre: 'Ana' },
      { id: 'c', nombre: 'Carla' },
    ]
    const docs = { c: [{ requisitoId: 'curp', archivo: arch }] }
    expect(resumenEquipo(personas, [curp], docs, { hoy: HOY }).map((r) => r.persona.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('validarArchivo', () => {
  const r: Requisito = { id: 'x', nombre: 'X', tipos: ['.PDF', 'image/*', 'application/zip'], tamanoMaxMb: 1 }
  it('acepta por extensión, comodín y tipo exacto', () => {
    expect(validarArchivo(r, { nombre: 'a.pdf', tamano: 10 }).ok).toBe(true)
    expect(validarArchivo(r, { nombre: 'foto', tamano: 10, tipo: 'image/png' }).ok).toBe(true)
    expect(validarArchivo(r, { nombre: 'z', tamano: 10, tipo: 'application/zip' }).ok).toBe(true)
  })
  it('rechaza tipo, tamaño y vacío', () => {
    expect(validarArchivo(r, { nombre: 'a.exe', tamano: 10, tipo: 'application/x-msdownload' })).toEqual({ ok: false, motivo: 'tipo' })
    expect(validarArchivo(r, { nombre: 'a.pdf', tamano: 2 * 1024 * 1024 })).toEqual({ ok: false, motivo: 'tamano' })
    expect(validarArchivo(r, { nombre: 'a.pdf', tamano: 0 })).toEqual({ ok: false, motivo: 'vacio' })
  })
  it('sin tipos acepta cualquiera y el máximo por omisión es 10 MB', () => {
    expect(validarArchivo({ id: 'x', nombre: 'X' }, { nombre: 'a.xyz', tamano: 10 }).ok).toBe(true)
    expect(validarArchivo({ id: 'x', nombre: 'X' }, { nombre: 'a', tamano: 11 * 1024 * 1024 }).motivo).toBe('tamano')
  })
})

describe('aCsv', () => {
  it('lleva BOM, encabezado y escapa comas, comillas y saltos', () => {
    const r = resumenPersona({ id: '1', nombre: 'López, "Laura"', puesto: 'Analista' }, [ine], [], { hoy: HOY })
    const csv = aCsv([r])
    expect(csv.startsWith('﻿Persona,Puesto')).toBe(true)
    expect(csv).toContain('"López, ""Laura"""')
    expect(csv.endsWith('\r\n')).toBe(true)
  })
  it('neutraliza fórmulas de Excel', () => {
    const r = resumenPersona({ id: '1', nombre: '=HYPERLINK("http://x")' }, [ine], [], { hoy: HOY })
    expect(aCsv([r])).toContain(`"'=HYPERLINK(""http://x"")"`)
    const mas = resumenPersona({ id: '1', nombre: '+52 55' }, [], [], { hoy: HOY })
    expect(aCsv([mas])).toContain("'+52 55")
  })
})
