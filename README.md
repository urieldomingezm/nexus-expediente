# nexus-expediente

El expediente digital del empleado para tu sistema: qué documentos pide cada puesto, cuáles entregó, cuáles faltan, cuáles se vencen y qué tan completo va. Sin dependencias, accesible y aislado con Shadow DOM.

Rama de librerías de [Nexus](https://github.com/urieldomingezm/nexus), junto a [nexus-dialogs](https://github.com/urieldomingezm/nexus-dialogs) y [nexus-tours](https://github.com/urieldomingezm/nexus-tours).

## Instalar

```sh
npm i nexus-expediente
```

## Primer expediente

```ts
import { montarExpediente } from 'nexus-expediente'

const control = montarExpediente(document.getElementById('expediente')!, {
  persona: { id: 'e-17', nombre: 'Laura Méndez', puesto: 'Analista' },
  requisitos: [
    { id: 'ine', nombre: 'INE', tipos: ['.pdf', 'image/*'], vigenciaDias: 3650 },
    { id: 'contrato', nombre: 'Contrato firmado', tipos: ['.pdf'], categoria: 'Contratación' },
    { id: 'curp', nombre: 'CURP', tipos: ['.pdf'] },
  ],
  documentos: await api.documentos('e-17'),
  puedeRevisar: true,
  actor: 'rrhh@empresa.mx',
  // Guarda el archivo en tu servidor (S3…) y devuelve la dirección si quieres el enlace «Ver».
  alSubir: async ({ requisito, archivo }) => ({ archivo: { nombre: archivo.name, tamano: archivo.size, url: await api.subir(requisito.id, archivo) } }),
  // Cada cambio llega como un registro de auditoría.
  alEvento: (e) => api.bitacora(e),
})
```

## Qué incluye

- **Estados claros**: pendiente, en revisión, aprobado, rechazado, por vencer, vencido y no aplica. Un documento vencido se ve vencido aunque estuviera aprobado.
- **Vencimientos**: `vigenciaDias` por requisito o `venceEn` por documento, con aviso configurable (`diasAviso`, 30 por omisión).
- **Requisitos por puesto**: cada requisito puede aplicar solo a ciertos puestos.
- **Revisión**: aprobar o rechazar con motivo, sin ventanas del navegador.
- **Vista de equipo**: `montarEquipo` muestra a quién le falta qué y exporta a CSV.
- **Motor sin DOM**: `nexus-expediente/motor` hace los mismos cálculos en tu API.
- **Accesible**: estado en texto (no solo color), teclado completo, avisos para lectores de pantalla y pruebas con axe.
- **Seguro**: los datos entran como texto, nunca como HTML.

## Lo que no hace

La librería no guarda archivos ni decide permisos: eso es de tu servidor. Valida el tipo y el tamaño para ayudar a la persona, pero tu API debe volver a validarlos. Ver [Seguridad](docs/seguridad.md).

## Licencia

MIT. Hecho por [DevMedina](https://devmedina.is-a.dev/).
