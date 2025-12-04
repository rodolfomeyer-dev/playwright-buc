import 'dotenv/config';   // ← ESTA LÍNEA ES OBLIGATORIA

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  use: {
    headless: false,           // cambia a true cuando quieras CI
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 20000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    baseURL: 'http://192.168.84.40/FrontEnd/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});