import { test, expect } from '@playwright/test';
import { loginBUC } from '../helpers/login';
import { buscarPorRUT } from '../helpers/busqueda';

/**
 * TEST SIMPLE: Validar que el login y búsqueda funcionen en TEST
 * 
 * Úsalo para verificar que todo está configurado correctamente
 * antes de ejecutar el test completo con 494 RUTs.
 */
test('Test Simple - Validar Login y Búsqueda en TEST', async ({ browser }) => {
    console.log('\n🧪 Ejecutando test simple de validación...\n');

    // Crear contexto con credenciales HTTP (para manejar popup NTLM)
    const context = await browser.newContext({
        httpCredentials: {
            username: 'mgarayv',
            password: 'Equipo111',
        },
    });
    const page = await context.newPage();

    // Login en TEST
    console.log('1️⃣ Haciendo login en TEST...');
    await loginBUC(page, 'TEST');
    console.log('   ✅ Login exitoso\n');

    // Buscar un RUT de prueba
    const rutPrueba = '12345678'; // Cambia esto por un RUT real de tu sistema
    console.log(`2️⃣ Buscando RUT: ${rutPrueba}...`);
    const nombre = await buscarPorRUT(page, rutPrueba);
    console.log(`   ✅ Resultado: ${nombre}\n`);

    // Validar que se encontró algo
    expect(nombre).not.toBe('ERROR_BUSQUEDA');

    // Captura de pantalla para verificar
    await page.screenshot({ path: 'evidencias/test-simple-screenshot.png', fullPage: true });
    console.log('📸 Captura guardada en: evidencias/test-simple-screenshot.png\n');

    await context.close();

    console.log('✅ Test simple completado exitosamente');
});

/**
 * TEST SIMPLE: Validar login en PROD
 */
test('Test Simple - Validar Login en PROD', async ({ browser }) => {
    console.log('\n🧪 Validando login en PROD...\n');

    // Crear contexto con credenciales HTTP (para manejar popup NTLM)
    const context = await browser.newContext({
        httpCredentials: {
            username: 'pruebas-bas2',
            password: 'Equipo.1125#',
        },
    });
    const page = await context.newPage();

    console.log('1️⃣ Haciendo login en PROD...');
    await loginBUC(page, 'PROD');
    console.log('   ✅ Login exitoso en PROD\n');

    // Captura de pantalla
    await page.screenshot({ path: 'evidencias/prod-login-screenshot.png', fullPage: true });
    console.log('📸 Captura guardada en: evidencias/prod-login-screenshot.png\n');

    await context.close();

    console.log('✅ Login en PROD validado');
});
