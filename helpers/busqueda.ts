
import { Page, Locator, expect } from '@playwright/test';

async function esperarConexion(page: Page) {
    while (true) {
        if (await page.evaluate(() => navigator.onLine)) return;
        console.log('   ⚠️ VPN desconectado...');
        await page.waitForTimeout(5000);
    }
}

async function infiniteRetry<T>(name: string, action: () => Promise<T>, page: Page): Promise<T> {
    while (true) {
        try { return await action(); } catch (error) {
            console.log(`   🔄 ${name} Error: ${error.message}`);
            await page.waitForTimeout(2000);
            try { await page.reload(); } catch (e) { }
        }
    }
}

async function seleccionarTipoBusqueda(page: Page, tipo: 'RUT' | 'NOMBRE') {
    const select = page.locator('select').first();
    await select.waitFor({ state: 'visible' });
    const option = tipo === 'RUT' ? 'CLIENTES POR SU RUT' : 'NOMBRE COMPLETO';
    await select.selectOption({ label: option });
}

export async function buscarPorRUT(page: Page, rut: string): Promise<string> {
    return infiniteRetry(`RUT ${rut}`, async () => {
        await seleccionarTipoBusqueda(page, 'RUT');
        await page.locator('input[type="text"]:visible').first().fill(rut.replace(/[^0-9Kk]/g, ''));
        await page.click('#Buscar');
        const tabla = page.locator('table').first();
        await tabla.waitFor({ state: 'visible', timeout: 15000 });
        const rows = tabla.locator('tr');
        if (await rows.count() > 0) {
            return (await rows.last().locator('td').nth(1).innerText()).trim();
        }
        return 'NO_ENCONTRADO';
    }, page);
}

export async function buscarPorNombre(page: Page, n: string, p: string, m: string): Promise<{ nombre: string, rut: string }[]> {
    return infiniteRetry(`Nombre: ${n} ${p}`, async () => {
        console.log(`   🔍 [${n}] [${p}] [${m}]`);
        await seleccionarTipoBusqueda(page, 'NOMBRE');
        await page.locator('#aguja').fill(n);
        await page.locator('#apellidoP').fill(p);
        await page.locator('#apellidoM').fill(m);
        await page.press('#apellidoM', 'Tab');
        await page.click('#Buscar');

        const tabla = page.locator('table').first();
        const msg = page.locator('text=/no se han encontrado|no existen/i');
        await Promise.race([tabla.waitFor({ state: 'visible', timeout: 20000 }), msg.waitFor({ state: 'visible', timeout: 20000 })]);

        if (await msg.isVisible()) return [];

        const resultados = [];
        const filas = await tabla.locator('tr').all();
        for (const fila of filas) {
            const celdas = await fila.locator('td').all();
            if (celdas.length >= 2) {
                let rutRaw = (await celdas[0].innerText()).trim();
                let nombreRaw = "";

                // Buscador de nombre dinámico (User Feedback: columnas variables)
                for (let i = 1; i < celdas.length; i++) {
                    const text = (await celdas[i].innerText()).trim();
                    if (text && !text.includes('-') && text.length > nombreRaw.length && !text.match(/^[0-9]+$/)) {
                        nombreRaw = text;
                    }
                }

                const rutLimpio = rutRaw.replace(/[^0-9Kk]/g, '').toUpperCase();
                if (rutLimpio) resultados.push({ rut: rutLimpio, nombre: nombreRaw });
            }
        }
        return resultados;
    }, page);
}
