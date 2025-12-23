import { test, expect, Browser } from '@playwright/test';
import path from 'path';
import { loginBUC } from '../helpers/login';
import { buscarPorRUT, esAnonimizado } from '../helpers/busqueda';
import {
    leerExcelEntrada,
    generarReporteExcel,
    ResultadoValidacion
} from '../helpers/excel';

/**
 * CONFIGURACIÓN
 */
const EXCEL_ENTRADA = path.join(process.cwd(), 'data', 'Ruts.xlsx');
const EXCEL_SALIDA = path.join(process.cwd(), 'evidencias', 'REPORTE_ANONIMIZACION.xlsx');

/**
 * TEST PRINCIPAL: Validar anonimización comparando TEST vs PROD
 * 
 * Flujo:
 * 1. Leer Excel con 494 RUTs
 * 2. Para cada RUT:
 *    - Buscar en TEST (debería estar anonimizado)
 *    - Buscar en PROD (debería tener nombre real)
 * 3. Comparar resultados
 * 4. Generar Excel con colores verde/rojo
 */
test('Validar Anonimización - TEST vs PROD', async ({ browser }) => {
    // ========================================
    // PASO 1: Leer Excel de entrada
    // ========================================
    console.log('\n🚀 Iniciando validación de anonimización...\n');
    const registros = await leerExcelEntrada(EXCEL_ENTRADA);

    if (registros.length === 0) {
        throw new Error('❌ No se encontraron registros en el Excel de entrada');
    }

    console.log(`📋 Total de RUTs a validar: ${registros.length}\n`);

    const resultados: ResultadoValidacion[] = [];

    // ========================================
    // PASO 2: Procesar cada RUT
    // ========================================
    for (let i = 0; i < registros.length; i++) {
        const { rut, nombreEsperado } = registros[i];

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📊 [${i + 1}/${registros.length}] Procesando RUT: ${rut}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // ----------------------------------------
        // BÚSQUEDA EN TEST (Anonimizado)
        // ----------------------------------------
        console.log('\n🔵 Buscando en TEST (Anonimizado)...');
        let nombreTest = 'ERROR';

        try {
            const contextTest = await browser.newContext({
                httpCredentials: {
                    username: 'mgarayv',
                    password: 'Equipo111',
                },
            });
            const pageTest = await contextTest.newPage();

            await loginBUC(pageTest, 'TEST');
            nombreTest = await buscarPorRUT(pageTest, rut);

            await contextTest.close();
        } catch (error) {
            console.error(`   ❌ Error en TEST:`, error);
            nombreTest = 'ERROR_BUSQUEDA';
        }

        // ----------------------------------------
        // BÚSQUEDA EN PROD (Real)
        // ----------------------------------------
        console.log('\n🔴 Buscando en PROD (Real)...');
        let nombreProd = 'ERROR';

        try {
            const contextProd = await browser.newContext({
                httpCredentials: {
                    username: 'pruebas-bas2',
                    password: 'Equipo.1125#',
                },
            });
            const pageProd = await contextProd.newPage();

            await loginBUC(pageProd, 'PROD');
            nombreProd = await buscarPorRUT(pageProd, rut);

            await contextProd.close();
        } catch (error) {
            console.error(`   ❌ Error en PROD:`, error);
            nombreProd = 'ERROR_BUSQUEDA';
        }

        // ----------------------------------------
        // VALIDACIÓN
        // ----------------------------------------
        const anonimizadoTest = esAnonimizado(nombreTest, nombreEsperado) ? 'SÍ' : 'NO';
        const anonimizadoProd = esAnonimizado(nombreProd, nombreEsperado) ? 'SÍ' : 'NO';

        // Estado final: TEST debe estar anonimizado (SÍ) y PROD no (NO)
        const estadoFinal =
            anonimizadoTest === 'SÍ' && anonimizadoProd === 'NO'
                ? '✅ VÁLIDO'
                : '⚠️ REVISAR';

        resultados.push({
            RUT: rut,
            'Nombre esperado': nombreEsperado,
            'Nombre en TEST': nombreTest,
            'Nombre en PROD': nombreProd,
            'ANONIMIZADO TEST': anonimizadoTest,
            'ANONIMIZADO PROD': anonimizadoProd,
            'ESTADO FINAL': estadoFinal,
        });

        console.log(`\n📌 Resultado:`);
        console.log(`   TEST: ${nombreTest} → Anonimizado: ${anonimizadoTest}`);
        console.log(`   PROD: ${nombreProd} → Anonimizado: ${anonimizadoProd}`);
        console.log(`   Estado: ${estadoFinal}`);
    }

    // ========================================
    // PASO 3: Generar reporte Excel
    // ========================================
    console.log('\n\n📊 Generando reporte final...');
    await generarReporteExcel(resultados, EXCEL_SALIDA);

    // ========================================
    // PASO 4: Resumen en consola
    // ========================================
    const validos = resultados.filter(r => r['ESTADO FINAL'] === '✅ VÁLIDO').length;
    const revisar = resultados.filter(r => r['ESTADO FINAL'] === '⚠️ REVISAR').length;

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 RESUMEN FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Válidos:  ${validos} / ${registros.length}`);
    console.log(`⚠️  Revisar:  ${revisar} / ${registros.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Mostrar tabla resumida
    console.table(
        resultados.map(r => ({
            RUT: r.RUT,
            'TEST Anon': r['ANONIMIZADO TEST'],
            'PROD Anon': r['ANONIMIZADO PROD'],
            Estado: r['ESTADO FINAL'],
        }))
    );
});
