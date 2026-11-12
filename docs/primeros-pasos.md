# Primeros pasos

## Instalar

```sh
npm i nexus-expediente
```

Sin npm, con una etiqueta `script` (queda `window.NexusExpediente`):

```html
<script src="https://unpkg.com/nexus-expediente"></script>
```

## 1. Define qué se pide

Cada requisito es un documento. Solo `id` y `nombre` son obligatorios.

```ts
const requisitos = [
  { id: 'ine', nombre: 'INE', tipos: ['.pdf', 'image/*'], vigenciaDias: 3650, categoria: 'Identificación' },
  { id: 'curp', nombre: 'CURP', tipos: ['.pdf'], categoria: 'Identificación' },
  { id: 'contrato', nombre: 'Contrato firmado', tipos: ['.pdf'], categoria: 'Contratación' },
  { id: 'licencia', nombre: 'Licencia de conducir', puestos: ['Chofer'], vigenciaDias: 1095 },
]
```

## 2. Muestra el expediente de una persona

```ts
import { montarExpediente } from 'nexus-expediente'

const control = montarExpediente(document.getElementById('expediente')!, {
  persona: { id: 'e-17', nombre: 'Laura Méndez', puesto: 'Analista' },
  requisitos,
  documentos: [], // lo que ya tengas guardado
  alSubir: async ({ requisito, archivo }) => {
    await fetch(`/api/expedientes/e-17/${requisito.id}`, { method: 'PUT', body: archivo })
  },
})
```

Si `alSubir` lanza un error, el documento no cambia y la persona ve un aviso.

## 3. Deja que RR. HH. revise

```ts
montarExpediente(el, { /* … */ puedeRevisar: true, actor: 'rrhh@empresa.mx', alRevisar: ({ requisito, decision, motivo }) => api.revisar(requisito.id, decision, motivo) })
```

## 4. Mira al equipo completo

```ts
import { montarEquipo } from 'nexus-expediente'

montarEquipo(document.getElementById('equipo')!, { personas, requisitos, documentos: { 'e-17': [] }, alAbrir: (p) => irAExpediente(p.id) })
```

## Siguiente

- [Guía](guia.html) con todas las opciones.
- [Integración](integracion.html) con tu API y con una bitácora.
