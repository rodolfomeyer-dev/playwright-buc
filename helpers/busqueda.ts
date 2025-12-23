import { Page, Locator } from '@playwright/test';

/**
 * Busca un RUT en BUC y retorna el nombre encontrado
 * 
 * @param page - Página autenticada en BUC
 * @param rut - RUT a buscar (sin formato, solo números)
 * @returns Nombre encontrado o 'NO_ENCONTRADO'
 */
export async function buscarPorRUT(page: Page, rut: string): Promise<string> {
    // Limpiar RUT: solo números y K, SIN puntos, SIN guión
    const rutLimpio = rut.replace(/[^0-9Kk]/g, '');

    console.log(`   🔍 Buscando RUT (sin formato): ${rutLimpio}`);

    // Seleccionar tipo de búsqueda
    try {
        const selectBusqueda = page.locator('select').first();
        await selectBusqueda.waitFor({ state: 'visible', timeout: 10000 });
        await selectBusqueda.click();
        await page.waitForTimeout(500);

        console.log('   → Seleccionando "CLIENTES POR SU RUT"...');
        await selectBusqueda.selectOption({ label: 'CLIENTES POR SU RUT' });
        await page.waitForTimeout(1000); // Esperar a que se habilite el campo
    } catch (error) {
        console.log('   ⚠️ Error al seleccionar dropdown');
        throw error;
    }

    // Buscar campo de búsqueda VISIBLE (excluir hidden)
    console.log(`   → Ingresando RUT: ${rutLimpio}...`);

    let campoBusqueda: Locator | undefined;

    // Método 1: Buscar inputs visibles con filter
    try {
        const inputs = page.locator('input[type="text"]');
        const count = await inputs.count();

        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const isVisible = await input.isVisible();
            const isEnabled = await input.isEnabled();

            if (isVisible && isEnabled) {
                campoBusqueda = input;
                console.log(`   → Campo encontrado (input visible #${i})`);
                break;
            }
        }
    } catch (e) {
        console.log('   ⚠️ Error al buscar campo:', e);
    }

    if (!campoBusqueda) {
        throw new Error('❌ No se pudo encontrar el campo de búsqueda visible');
    }

    // Ingresar RUT
    await campoBusqueda.click();
    await page.waitForTimeout(300);
    await campoBusqueda.clear();
    await campoBusqueda.fill(rutLimpio);
    await page.waitForTimeout(500);

    // Verificar
    const valorIngresado = await campoBusqueda.inputValue();
    console.log(`   → Valor ingresado: "${valorIngresado}"`);

    if (valorIngresado !== rutLimpio) {
        console.log(`   ⚠️ Reintentando con type()...`);
        await campoBusqueda.clear();
        await campoBusqueda.type(rutLimpio);
    }

    // Buscar y hacer clic en botón BUSCAR
    console.log('   → Haciendo clic en BUSCAR...');

    try {
        // Buscar el botón usando múltiples selectores
        const botonBuscar = page.locator('button:has-text("BUSCAR"), input[value="BUSCAR"], [id*="Buscar"], [class*="buscar"]').first();

        // Asegurar que esté visible y hacer scroll si es necesario
        await botonBuscar.scrollIntoViewIfNeeded();
        await botonBuscar.waitFor({ state: 'visible', timeout: 10000 });

        // Intentar clic normal primero
        try {
            await botonBuscar.click({ timeout: 5000 });
        } catch {
            // Si falla, usar force click
            console.log('   ⚠️ Clic normal falló, usando force click...');
            await botonBuscar.click({ force: true });
        }
    } catch (error) {
        console.error('   ❌ Error al hacer clic en BUSCAR:', error);
        throw new Error('No se pudo hacer clic en el botón BUSCAR');
    }

    // Esperar resultados
    try {
        const resultadoVisible = await page.getByText(rutLimpio).isVisible({ timeout: 40000 });

        if (!resultadoVisible) {
            console.log(`   ❌ RUT ${rutLimpio} no encontrado`);
            return 'NO_ENCONTRADO';
        }

        const nombre = await page
            .locator('td, div, span')
            .filter({ hasText: /[A-Z]{3,}/ })
            .first()
            .innerText();

        const nombreLimpio = nombre.trim();
        console.log(`   ✅ Nombre encontrado: ${nombreLimpio}`);
        return nombreLimpio;

    } catch (error) {
        console.log(`   ⚠️ Error buscando RUT:`, error);
        return 'ERROR_BUSQUEDA';
    }
}

/**
 * Valida si un nombre está anonimizado
 */
export function esAnonimizado(nombreReal: string, nombreEsperado: string): boolean {
    if (nombreReal === 'NO_ENCONTRADO' || nombreReal === 'ERROR_BUSQUEDA') {
        return false;
    }

    const realUpper = nombreReal.toUpperCase();
    const esperadoUpper = nombreEsperado.toUpperCase();

    return !esperadoUpper.includes(realUpper) && !realUpper.includes(esperadoUpper);
}
