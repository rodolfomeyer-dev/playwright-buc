import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración optimizada para BUC con timeouts largos (V6 Fixed)
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1,
    outputDir: './evidencias',
    reporter: [
        ['html'],
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }]
    ],

    use: {
        actionTimeout: 30000,
        navigationTimeout: 120000,
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'on',
        trace: 'retain-on-failure',
        extraHTTPHeaders: {
            'Accept-Language': 'es-CL,es;q=0.9',
        },
    },

    timeout: 300000,
    expect: {
        timeout: 30000,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
});
