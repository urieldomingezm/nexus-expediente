import { cssEnPlantillas } from './scripts/css-en-plantillas.mjs'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { docsPlugin } from './site/plugin-docs.mjs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const define = { __VERSION__: JSON.stringify(version) }

const src = (f) => fileURLToPath(new URL(`./src/${f}`, import.meta.url))
// Lo más específico primero: 'nexus-expediente' también coincidiría con 'nexus-expediente/motor'.
const ALIAS = { 'nexus-expediente/motor': src('motor-entrada.ts'), 'nexus-expediente': src('index.ts') }

// Un build por modo. `npm run build` los corre todos.
const LIBS = {
  core: { entry: 'src/index.ts', name: 'NexusExpediente', fileName: 'nexus-expediente', formats: ['es', 'umd'] },
  motor: { entry: 'src/motor-entrada.ts', name: 'NexusExpedienteMotor', fileName: 'motor', formats: ['es', 'umd'] },
  all: { entry: 'src/global.ts', name: 'NexusExpediente', fileName: 'nexus-expediente.all', formats: ['es', 'iife'] },
}

export default defineConfig(({ mode, command }) => {
  const lib = LIBS[mode]
  if (command === 'build' && lib) {
    return {
      define,
      plugins: [cssEnPlantillas()],
      resolve: mode === 'all' ? { alias: ALIAS } : undefined,
      build: {
        lib: { entry: lib.entry, name: lib.name, fileName: lib.fileName, formats: lib.formats },
        emptyOutDir: mode === 'core',
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: true,
      },
    }
  }
  // Sitio de documentación: `npm run build:site` → site-dist/ (rutas relativas: sirve en GitHub Pages bajo cualquier ruta).
  if (command === 'build' && mode === 'site') {
    const paginas = ['index', 'primeros-pasos', 'guia', 'ejemplos', 'integracion', 'seguridad', 'novedades', 'api']
    return {
      root: 'site',
      base: './',
      define,
      plugins: [docsPlugin(), cssEnPlantillas()],
      resolve: { alias: ALIAS },
      build: {
        outDir: '../site-dist',
        emptyOutDir: true,
        target: 'es2022',
        rollupOptions: { input: Object.fromEntries(paginas.map((p) => [p, fileURLToPath(new URL(`./site/${p}.html`, import.meta.url))])) },
      },
    }
  }
  // Servidor de desarrollo y pruebas: todo desde el código fuente.
  return { define, plugins: [docsPlugin(), cssEnPlantillas()], resolve: { alias: ALIAS } }
})
