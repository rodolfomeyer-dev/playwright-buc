import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración optimizada para BUC con timeouts largos
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false, // Ejecutar secuencialmente para evitar sobrecarga en servidores lentos
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1, // Un worker para evitar conflictos de sesión
    reporter: [
        ['html'],
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }]
    ],

    use: {
        // Timeouts extendidos para servidores lentos
        actionTimeout: 30000,
        navigationTimeout: 120000,

        // Configuración de red
        bypassCSP: true,
        ignoreHTTPSErrors: true,

        // Capturas para debugging
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',

        // Headers personalizados
        extraHTTPHeaders: {
            'Accept-Language': 'es-CL,es;q=0.9',
        },
    },

    // Timeouts globales extendidos
    timeout: 300000, // 5 minutos por test
    expect: {
        timeout: 30000,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Credenciales HTTP Basic/NTLM (si es necesario)
                httpCredentials: undefined, // Se maneja por URL
            },
        },
    ],

    outputDir: 'test-results/',
});
