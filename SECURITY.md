# Seguridad

## Cómo reportar una vulnerabilidad

Abre un [aviso privado](https://github.com/urieldomingezm/nexus-expediente/security/advisories/new) en la pestaña *Security* del repositorio. **No uses un *issue* público** para vulnerabilidades.

Incluye la versión, el navegador, los pasos para reproducirlo y qué impacto tiene.

## Qué puedes esperar

- Acuse de recibo en **7 días**.
- Una primera valoración (¿se confirma? ¿qué tan grave?) en **14 días**.
- Si se confirma, una corrección y una versión publicada lo antes posible; el aviso se hace público cuando la versión ya está en npm, y se te reconoce si quieres.
- Esto lo mantiene una sola persona: los tiempos son de buena fe, no un contrato.

## Versiones con correcciones de seguridad

Mientras la librería esté en 0.x, solo se corrige la **última versión publicada**. Desde la 1.0, la última 1.x.

## Cómo se publica una versión

1. Todo cambio entra por *pull request* con lint, tipos, pruebas unitarias, pruebas e2e en Chromium, Firefox y WebKit, comprobación del paquete (Node ESM/CJS, TypeScript, Vite, webpack y *tree-shaking*), tamaños y reporte de API.
2. `npm audit` de producción corre en cada cambio. La librería no tiene dependencias en tiempo de ejecución; las de desarrollo las actualiza Dependabot cada semana.
3. La publicación la dispara una etiqueta `vX.Y.Z` y se sube a npm **en espera** (*staged publishing*): no es pública hasta que la persona responsable la aprueba con 2FA en npmjs.com.
4. El token de npm es de «solo subir en espera» y no se salta el 2FA.

Qué hace la librería con el HTML que recibe, el filtro `sanitize`, el modo `strictHtml`, CSP, Trusted Types y la exportación: [`docs/seguridad.md`](docs/seguridad.md).
