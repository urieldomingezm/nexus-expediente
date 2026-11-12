# Seguridad

## Lo que la librería hace

- **Texto, no HTML.** Nombres, descripciones, archivos y motivos se insertan con `textContent`: un nombre como `<img onerror=…>` se ve tal cual, no se ejecuta.
- **Aislada.** La interfaz vive en un Shadow DOM; los estilos de tu página no la rompen ni ella rompe los tuyos.
- **Sin CSP especial.** No usa `eval` ni atributos `style`.
- **CSV seguro.** `aCsv` antepone un apóstrofo a las celdas que empiezan con `=`, `+`, `-` o `@`, para que Excel no las ejecute como fórmulas.
- **Enlaces.** «Ver» abre con `rel="noopener noreferrer"`. Usa solo direcciones que tu servidor controle.

## Lo que le toca a tu servidor

- Revisar tipo, tamaño y **contenido** de cada archivo (antivirus, tipo real).
- Verificar que quien sube o revisa tiene permiso sobre esa persona y esa empresa.
- Servir los archivos con direcciones firmadas y de corta vida.
- Tomar el `actor` de la sesión, nunca de lo que envía el navegador.

## Datos personales

Un expediente contiene datos personales (INE, CURP, NSS). La librería no los envía a ningún lado: todo pasa por tus funciones `alSubir`, `alRevisar` y `alEvento`. Encárgate del aviso de privacidad y de cuánto tiempo los conservas.

## Reportar una vulnerabilidad

Mira [SECURITY.md](https://github.com/urieldomingezm/nexus-expediente/blob/main/SECURITY.md).
