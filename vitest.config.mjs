// Pruebas unitarias con happy-dom: npm run test:unit
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      'nexus-expediente/motor': fileURLToPath(new URL('./src/motor-entrada.ts', import.meta.url)),
      'nexus-expediente': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/unit/**/*.test.ts'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/global.ts', 'src/estilos.ts', 'src/motor-entrada.ts', 'src/index.ts'],
      thresholds: { lines: 85, functions: 80, branches: 70, statements: 85 },
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
})
