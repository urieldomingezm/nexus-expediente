// Plugin de Vite: encoge el CSS que vive en plantillas de texto (`const X_CSS = \`...\``) antes de empaquetar.
// Quita comentarios, saltos de línea y espacios sobrantes: nada de eso lo necesita el navegador, pero se descarga.
// Solo toca constantes cuyo nombre contiene «CSS» y respeta las interpolaciones `${...}`.
const CONSTANTE = /((?:export\s+)?const\s+\w*CSS\w*\s*=\s*)`([^`]*)`/g

export function encoger(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .replace(/;}/g, '}')
}

export function cssEnPlantillas() {
  return {
    name: 'css-en-plantillas',
    enforce: 'pre',
    transform(code, id) {
      if (!/[\\/]src[\\/].*\.ts$/.test(id) || !code.includes('CSS')) return null
      const salida = code.replace(CONSTANTE, (_, cabeza, cuerpo) => {
        const partes = cuerpo.split(/(\$\{[^}]*\})/)
        const nuevo = partes.map((p, i) => (i % 2 ? p : encoger(p))).join('')
        return `${cabeza}\`${nuevo}\``
      })
      return salida === code ? null : { code: salida, map: null }
    },
  }
}
