import { Page } from '@playwright/test';

export interface ConfigEntorno {
    readonly url: string;
    readonly usuario: string;
    readonly password: string;
    readonly passwordEncoded: string;
    readonly nombre: string;
}

/**
 * Configuración de entornos BUC
 */
export const ENTORNOS: Record<string, ConfigEntorno> = {
    ANONIMIZADA: {
        url: 'http://192.168.154.221:8070/HpUxaLinux/BUC/buc/?usuEjeFor=mgarayv',
        usuario: 'pruebas-bas2',
        password: 'Equipo.1125#',
        passwordEncoded: 'Equipo.1125%23', // # codificado
        nombre: 'ANONIMIZADA (TEST)',
    },
    NO_ANONIMIZADA: {
        url: 'http://192.168.154.54:8070/HpUxaLinux/BUC/buc/?usuEjeFor=amunoz',
        usuario: 'mgarayv',
        password: 'Equipo123',
        passwordEncoded: 'Equipo123',
        nombre: 'NO ANONIMIZADA (PROD)',
    },
} as const;

export type Entorno = 'ANONIMIZADA' | 'NO_ANONIMIZADA';

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
    // Usar credenciales en URL para ambos (soluciona error 403 y problemas de sesión)
    const urlFinal = config.url.replace('http://', `http://${config.usuario}:${config.passwordEncoded}@`);

    console.log(`   → Navegando a ${entorno}...`);

    await page.goto(urlFinal, {
        timeout: 120000,
        waitUntil: 'domcontentloaded',
    });

    // PASO 2: Verificar si ya está en la página principal 
    console.log('   → Verificando estado de autenticación (buscando selectores de búsqueda)...');

    try {
        // Intentar encontrar la página principal por el dropdown o el título
        const dropdownPresente = await page.locator('select').first().isVisible({ timeout: 10000 });
        const moduloBuc = await page.locator('text=/MODULO BUC/i').isVisible({ timeout: 5000 });

        if (dropdownPresente || moduloBuc) {
            console.log(`   ✅ Ya autenticado en ${config.nombre}`);
            return;
        }
    } catch (error) {
        console.log('   → No se detectó sesión activa inmediata.');
    }

    // PASO 3: Si llegamos aquí, buscar y llenar el formulario HTML de login (NTLM fallback)
    console.log(`   → Intentando fallback de formulario...`);
    try {
        const campoUsuario = page.locator('input[name*="user"], input[name*="usuario"], input[type="text"]').first();
        const existe = await campoUsuario.isVisible({ timeout: 10000 });

        if (existe) {
            console.log('   → Formulario HTML encontrado, ingresando credenciales...');
            await campoUsuario.fill(config.usuario);
            await page.locator('input[type="password"]').first().fill(config.password);

            const botonAcceder = page.locator('button, input[type="submit"]').filter({ hasText: /acceder|entrar|buscar/i }).first();
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
                botonAcceder.click(),
            ]);
        }
    } catch (error) {
        console.log('   ℹ️ No se encontró formulario de login HTML adicional.');
    }

    // PASO 4: Verificación Final
    try {
        await page.waitForSelector('select', { timeout: 30000 });
        console.log(`✅ Login exitoso en ${config.nombre}`);
    } catch (error) {
        console.error(`   ❌ Falló verificación de login en ${config.nombre}.`);
        // Tomar screenshot de error si estamos en test
        await page.screenshot({ path: `evidencias/error-login-${entorno}.png` }).catch(() => { });
        throw new Error(`No se pudo cargar la página de búsqueda en ${config.nombre}`);
    }
}
