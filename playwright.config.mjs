// Pruebas de punta a punta en Chromium, Firefox y WebKit (Safari).
//   npm run test:e2e                        → los tres navegadores
//   npm run test:e2e -- --project=chromium  → solo uno
// PW_CHROMIUM=/ruta/a/chrome usa un Chromium ya instalado (entornos sin acceso al CDN de Playwright).
import { defineConfig } from '@playwright/test'

const CI = !!process.env.CI
const chromiumPath = process.env.PW_CHROMIUM || undefined

export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.spec.mjs',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list']],
  use: { trace: 'retain-on-failure', baseURL: 'http://localhost:5399/' },
  webServer: [
    { command: 'npx vite --port 5399 --strictPort', url: 'http://localhost:5399/test/paginas/', reuseExistingServer: !CI, timeout: 60_000 },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath: chromiumPath } } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
})
