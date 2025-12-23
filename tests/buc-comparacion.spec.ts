import { test, expect } from '@playwright/test';
import { leerExcelEntrada, generarReporteExcel, RegistroEntrada, ResultadoValidacion } from '../helpers/excel';
import path from 'path';

// --- CONFIGURACIÓN ---
const CREDENTIALS = {
    ANON: {
        user: 'pruebas-bas2',
        pass: 'Equipo.1125#'
    },
    NO_ANON: {
        user: 'mgarayv',
        pass: 'Equipo123'
    }
};

const URLS = {
    ANONIMIZADO: 'http://192.168.154.221:8070/HpUxaLinux/BUC/buc/?usuEjeFor=mgarayv',
    NO_ANONIMIZADO: 'http://192.168.154.54:8070/HpUxaLinux/BUC/buc/?usuEjeFor=amunoz'
};

// Rutas de archivos
const DATA_FILE = path.join(__dirname, '../data/Ruts.xlsx');
const REPORT_FILE = path.join(__dirname, '../evidencias/REPORTE_COMPARACION_BUC.xlsx');

test.describe('Automatización BUC - Comparación de Ambientes', () => {

    // Almacenará los registros leídos del Excel
    let registros: RegistroEntrada[] = [];
    // Almacenará los resultados para el reporte
    let resultados: ResultadoValidacion[] = [];

    test.beforeAll(async () => {
        console.log('--- INICIANDO LECTURA DE DATOS ---');
        try {
            registros = await leerExcelEntrada(DATA_FILE);
            if (registros.length === 0) {
                console.warn('⚠️ No se encontraron registros en el archivo Excel.');
            }
        } catch (error) {
            console.error('❌ Error fatal leyendo el Excel:', error);
            throw error;
        }
    });

    test.afterAll(async () => {
        console.log('--- GENERANDO REPORTE FINAL ---');
        if (resultados.length > 0) {
            await generarReporteExcel(resultados, REPORT_FILE);
        } else {
            console.log('ℹ️ No hay resultados para generar reporte.');
        }
    });

    test('Comparar RUTs en ambos ambientes - Batch Processing', async ({ browser }) => {
        // Aumentar timeout del test para soportar 500 registros
        test.setTimeout(60 * 60 * 1000); // 60 minutos

        if (registros.length === 0) test.skip();

        const BATCH_SIZE = 50;
        let context = await browser.newContext();
        let page = await context.newPage();

        try {
            for (const [index, registro] of registros.entries()) {

                // Reiniciar contexto cada BATCH_SIZE registros para liberar memoria
                if (index > 0 && index % BATCH_SIZE === 0) {
                    console.log(`\n♻️ Reiniciando navegador (Batch ${index})...`);
                    await page.close();
                    await context.close();
                    context = await browser.newContext();
                    page = await context.newPage();
                }

                console.log(`\n🔄 Procesando[${index + 1}/${registros.length}]RUT: ${registro.rut} `);

                const resultadoRow: ResultadoValidacion = {
                    RUT: registro.rut,
                    'Nombre esperado': registro.nombreEsperado,
                    'Nombre en TEST': 'N/A', // Anonimizado
                    'Nombre en PROD': 'N/A', // No Anonimizado
                    'ANONIMIZADO TEST': '?',
                    'ANONIMIZADO PROD': '?',
                    'ESTADO FINAL': 'PENDIENTE'
                };

                // Función helper local modificada para usar la página actual
                const buscarYExtraer = async (url: string, creds: { user: string, pass: string }, ambiente: 'TEST' | 'PROD') => {
                    let nombreExtraido = 'ERROR';
                    try {
                        console.log(`   ➡️ Navegando a BUC ${ambiente}...`);

                        // Inyectar credenciales
                        const urlObj = new URL(url);
                        urlObj.username = creds.user;
                        urlObj.password = creds.pass;
                        const authUrl = urlObj.toString();

                        await page.goto(authUrl, { timeout: 45000 }); // Aumentar timeout navegación

                        // Manejo de Login (si aparece)
                        try {
                            const loginVisible = await page.locator('input[name="j_username"]').isVisible({ timeout: 2000 });
                            if (loginVisible) {
                                console.log(`   🔑 Login requerido en ${ambiente} `);
                                await page.locator('input[name="j_username"]').fill(creds.user);
                                await page.locator('input[name="j_password"]').fill(creds.pass);
                                await page.locator('input[name="btnEnter"]').click();
                                await page.waitForLoadState('networkidle');
                            }
                        } catch (ignore) { }

                        // Seleccionar Rut
                        const selectTipo = page.locator('select#opcion');
                        if (await selectTipo.isVisible({ timeout: 5000 })) {
                            await selectTipo.selectOption('Rut');
                        }

                        // Ingresar RUT (#aguja)
                        const inputRut = page.locator('input#aguja');
                        await inputRut.fill(registro.rut);

                        // Click Buscar
                        await inputRut.press('Tab');
                        const btnBuscar = page.locator('a#Buscar');
                        try {
                            await btnBuscar.waitFor({ state: 'visible', timeout: 3000 });
                            await btnBuscar.click({ force: true });
                        } catch (e) {
                            // Fallback
                            await inputRut.press('Enter');
                        }

                        // Esperar resultados
                        // Usamos .nth(1) para obtener la segunda fila (0-indexed)
                        const rowSelector = page.locator('table#datos tr').nth(1);
                        const cellSelector = rowSelector.locator('td').nth(1); // Index 1: NOMBRE

                        try {
                            await rowSelector.waitFor({ state: 'visible', timeout: 15000 });
                            if (await cellSelector.count() > 0) {
                                nombreExtraido = (await cellSelector.innerText()).trim();
                            } else {
                                const link = rowSelector.locator('a').first();
                                if (await link.count() > 0) {
                                    nombreExtraido = (await link.innerText()).trim();
                                } else {
                                    nombreExtraido = 'NO ENCONTRADO (Celda vacía)';
                                }
                            }
                        } catch (e) {
                            // Fallback debug
                            try {
                                const tablaContent = await page.locator('table#datos').innerText();
                            } catch (ign) { }

                            const msg = await page.locator('.error, .warning').first();
                            if (await msg.isVisible()) {
                                nombreExtraido = `ERROR APPS: ${await msg.innerText()}`;
                            } else {
                                nombreExtraido = 'NO ENCONTRADO';
                            }
                        }

                    } catch (e) {
                        console.error(`      ❌ Error en flujo ${ambiente}: ${e.message} `);
                        nombreExtraido = `ERROR: ${e.message} `;
                    }
                    return nombreExtraido;
                };

                // 1. AMBIENTE ANONIMIZADA (TEST)
                resultadoRow['Nombre en TEST'] = await buscarYExtraer(URLS.ANONIMIZADO, CREDENTIALS.ANON, 'TEST');

                // 2. AMBIENTE NO ANONIMIZADA (PROD)
                resultadoRow['Nombre en PROD'] = await buscarYExtraer(URLS.NO_ANONIMIZADO, CREDENTIALS.NO_ANON, 'PROD');

                // Comparaciones
                const nombreExcel = registro.nombreEsperado.toUpperCase();
                const nombreTest = resultadoRow['Nombre en TEST'].toUpperCase();
                const nombreProd = resultadoRow['Nombre en PROD'].toUpperCase();

                if (nombreTest !== 'NO ENCONTRADO' && !nombreTest.startsWith('ERROR')) {
                    resultadoRow['ANONIMIZADO TEST'] = nombreTest !== nombreExcel ? 'SÍ' : 'NO';
                }
                if (nombreProd !== 'NO ENCONTRADO' && !nombreProd.startsWith('ERROR')) {
                    resultadoRow['ANONIMIZADO PROD'] = nombreProd !== nombreExcel ? 'SÍ' : 'NO';
                }

                if (resultadoRow['ANONIMIZADO TEST'] === 'SÍ' && resultadoRow['ANONIMIZADO PROD'] === 'NO') {
                    resultadoRow['ESTADO FINAL'] = '✅ VÁLIDO';
                } else {
                    resultadoRow['ESTADO FINAL'] = '❌ REVISAR';
                }

                resultados.push(resultadoRow);
            }
        } finally {
            await context.close();
        }
    });
});

