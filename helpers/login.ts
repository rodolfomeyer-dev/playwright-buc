import { Page } from '@playwright/test';

/**
 * Configuración de entornos BUC
 */
export const ENTORNOS = {
    TEST: {
        url: 'http://192.168.84.40/FrontEnd/?usuEjeFor=mgarayv',
        usuario: 'mgarayv',
        password: 'Equipo111',
        passwordEncoded: 'Equipo111', // No tiene caracteres especiales
        nombre: 'TEST (Anonimizado)',
    },
    PROD: {
        url: 'http://192.168.154.54:8070/HpUxaLinux/BUC/buc/?usuEjeFor=amunoz',
        usuario: 'pruebas-bas2',
        password: 'Equipo.1125#',
        passwordEncoded: 'Equipo.1125%23', // # codificado
        nombre: 'PRODUCCIÓN',
    },
} as const;

export type Entorno = keyof typeof ENTORNOS;

/**
 * Login en BUC usando formulario HTML de la página web
 * 
 * @param page - Página de Playwright
 * @param entorno - 'TEST' o 'PROD'
 * @returns Promise<void>
 */
export async function loginBUC(page: Page, entorno: Entorno): Promise<void> {
    const config = ENTORNOS[entorno];

    console.log(`🔐 Iniciando login en ${config.nombre}...`);

    // PASO 1: Navegar a la URL 
    // Para PROD, usar credenciales en URL (soluciona error 403)
    // Para TEST, httpCredentials del contexto es suficiente
    const urlFinal = entorno === 'PROD'
        ? config.url.replace('http://', `http://${config.usuario}:${config.passwordEncoded}@`)
        : config.url;

    console.log(`   → Navegando a ${entorno}...`);

    await page.goto(urlFinal, {
        timeout: 120000,
        waitUntil: 'domcontentloaded',
    });

    // PASO 2: Verificar si ya está en la página principal (autenticación NTLM exitosa)
    console.log('   → Verificando estado de autenticación...');

    try {
        // Intentar encontrar la página principal
        const paginaPrincipal = await page.locator('text=/busqueda avanzada/i').isVisible({ timeout: 5000 });

        if (paginaPrincipal) {
            console.log('   ✅ Ya autenticado (httpCredentials funcionó)');
            console.log(`✅ Login exitoso en ${config.nombre}`);
            return; // Ya está logueado, salir
        }
    } catch (error) {
        // No está en página principal, intentar formulario HTML
        console.log('   → No está en página principal, buscando formulario HTML...');
    }

    // PASO 3: Si llegamos aquí, buscar y llenar el formulario HTML de login
    try {
        // Esperar a que aparezca el campo de usuario
        await page.waitForSelector('input[placeholder*="Nombre de usuario"], input[name*="usuario"], input[type="text"]', {
            timeout: 10000
        });

        console.log('   → Formulario HTML encontrado, ingresando credenciales...');

        // Llenar campo de usuario
        const campoUsuario = page.locator('input[placeholder*="Nombre de usuario"]').first();
        await campoUsuario.fill(config.usuario);

        // Llenar campo de contraseña
        const campoPassword = page.locator('input[type="password"]').first();
        await campoPassword.fill(config.password);

        // Pequeña espera para asegurar que los campos se llenaron
        await page.waitForTimeout(500);

        // Hacer clic en botón "Acceder"
        const botonAcceder = page.getByRole('button', { name: /acceder/i });

        console.log('   → Haciendo clic en "Acceder"...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 90000 }),
            botonAcceder.click(),
        ]);

    } catch (error) {
        console.error('   ❌ Error al buscar/llenar formulario:', error);
        throw new Error(`Fallo al hacer login en ${config.nombre}: ${error}`);
    }

    // PASO 4: Verificar que estamos en la página principal
    console.log('   → Verificando acceso exitoso...');
    await page.waitForSelector('text=/busqueda avanzada/i', { timeout: 90000 });
    console.log(`✅ Login exitoso en ${config.nombre}`);
}
