# Integración

La librería pone la interfaz y los cálculos. Tu servidor guarda los archivos, decide quién puede qué y registra lo que pasó.

## Guardar archivos

`alSubir` recibe el `File` ya validado. Súbelo a tu almacenamiento y devuelve, si quieres, los datos del documento:

```ts
alSubir: async ({ persona, requisito, archivo }) => {
  const { url } = await api.subir(persona.id, requisito.id, archivo)
  return { archivo: { nombre: archivo.name, tamano: archivo.size, url } }
}
```

Tu API debe volver a revisar tipo, tamaño y permisos. La validación del navegador es una ayuda, no una garantía.

## Una API con varias empresas

El `persona.id` y el `requisito.id` que manda el navegador no son de confianza: tu API debe filtrar siempre por la empresa de quien inicia sesión (y, en PostgreSQL, con RLS), igual que en el resto de Nexus.

## Bitácora de auditoría

`alEvento` avisa cada cambio con la forma de un registro de auditoría:

```ts
alEvento: (e) => api.bitacora.registrar(e)
```

```json
{
  "tipo": "documento.rechazado",
  "personaId": "e-17",
  "requisitoId": "ine",
  "en": "2026-11-12T15:04:05.000Z",
  "actor": "rrhh@empresa.mx",
  "antes": { "requisitoId": "ine", "revision": "pendiente" },
  "despues": { "requisitoId": "ine", "revision": "rechazado", "motivo": "Foto borrosa" },
  "motivo": "Foto borrosa"
}
```

Los tipos son `documento.subido`, `documento.aprobado`, `documento.rechazado` y `documento.quitado`. Guarda `actor` desde tu sesión en el servidor, no desde lo que mande el navegador.

## Los mismos cálculos en tu API

```ts
import { resumenEquipo } from 'nexus-expediente/motor'

const filas = resumenEquipo(personas, requisitos, documentosPorPersona, { hoy: '2026-11-12' })
```

Sirve para reportes, correos de «documentos por vencer» o tareas programadas.
