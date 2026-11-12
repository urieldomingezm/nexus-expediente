# Cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones con [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

## [0.1.0] - 2026-11-12

### Agregado

- Primera versión de **nexus-expediente**: el expediente digital del empleado, sin dependencias.
- `montarExpediente`: lista de documentos por persona con estado (pendiente, en revisión, aprobado, rechazado, por vencer, vencido, no aplica), avance, subida, revisión (aprobar o rechazar con motivo), filtros y avisos para lectores de pantalla. Vive en un Shadow DOM, con tema claro, oscuro o automático.
- `montarEquipo`: a quién le falta qué, de menor a mayor avance, con búsqueda y exportación a CSV (protegida contra fórmulas de Excel).
- `nexus-expediente/motor`: la lógica sin DOM (estados, vencimientos, avance, validación de archivos, CSV) para usarla también en el servidor.
- `alEvento`: cada cambio llega con la forma de un registro de auditoría (quién, qué, cuándo, antes y después), listo para guardarlo en una bitácora.
- Sitio de documentación y flujos de CI, «Nueva versión», «Publicar en npm» y «Documentación», igual que en nexus-dialogs.
