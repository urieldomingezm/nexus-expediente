# Guía

## Estados

| Estado | Cuándo |
|---|---|
| `pendiente` | No hay archivo. |
| `entregado` | Hay archivo y espera revisión. |
| `aprobado` | Revisado y bueno (o el requisito no necesita revisión). |
| `rechazado` | Revisado y devuelto, con motivo. |
| `por_vencer` | Aprobado, pero vence en `diasAviso` días o menos. |
| `vencido` | Pasó la fecha de vencimiento. Gana sobre cualquier otro estado. |
| `no_aplica` | El documento no corresponde a esta persona (`noAplica: true`). |

Cuentan como **cumplidos** `aprobado`, `por_vencer` y `no_aplica`. El avance se calcula solo con los requisitos obligatorios.

## Requisitos

| Campo | Para qué sirve |
|---|---|
| `id`, `nombre` | Obligatorios. |
| `descripcion` | Texto de ayuda bajo el nombre. |
| `obligatorio` | `false` para que se muestre pero no reste avance. |
| `vigenciaDias` | Días que vale el documento desde que se entrega. |
| `tipos` | `['.pdf', 'image/*', 'application/pdf']`. |
| `tamanoMaxMb` | Máximo en MB (10 por omisión). |
| `puestos` | Solo aplica a esos puestos. |
| `requiereRevision` | `false` para que quede aprobado al entregarlo. |
| `categoria` | Agrupa la lista con un título. |

## Fechas

Todas son `AAAA-MM-DD`, sin hora, para que no se corran un día por la zona horaria. «Hoy» es la fecha local del navegador; en el servidor pásala con la opción `hoy`.

## Textos y tema

```ts
montarExpediente(el, { /* … */ tema: 'oscuro', locale: 'es-MX', textos: { subir: 'Cargar', estados: { entregado: 'Esperando a RR. HH.' } } })
```

`tema` es `auto` (sigue al sistema), `claro` u `oscuro`.

## Control devuelto

```ts
control.actualizar(documentosNuevos) // vuelve a dibujar
control.resumen()                    // avance, faltantes, vencidos…
control.destruir()
```

## Solo la lógica

`nexus-expediente/motor` no toca el DOM:

```ts
import { resumenPersona, resumenEquipo, estadoDe, validarArchivo, aCsv } from 'nexus-expediente/motor'
```
