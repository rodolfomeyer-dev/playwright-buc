
import { test, expect } from '@playwright/test';
import { leerExcelEntrada, RegistroEntrada, normalizarV7 } from '../helpers/excel';
import { buscarPorNombre } from '../helpers/busqueda';
import { loginBUC } from '../helpers/login';
import path from 'path';
import fs from 'fs';
import { generarDashboardHTML } from '../scripts/generar-dashboard-v6';
import { generarInformeProfesionalV7 } from '../scripts/generar-reporte-v7';

const EXCEL_FILE = path.join(process.cwd(), 'data', 'Ruts.xlsx');
const PROGRESO_JSON = path.join(process.cwd(), 'evidencias', 'PROGRESO_V7.json');
const INFORME_V7 = path.join(process.cwd(), 'evidencias', 'Informe_Validacion_BUC_V7_FINAL.xlsx');
const DASHBOARD_HTM = path.join(process.cwd(), 'evidencias', 'DASHBOARD_V7.html');
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : 500;

interface ResultadoV7 {
    rut: string;
    nombreOriginal: string;
    nombreEnmascarado: string;
    devueltoNoAnon: string;
    devueltoAnon: string;
    rutMatchNoAnon: boolean;
    rutMatchAnon: boolean;
    nameNoAnonMatchOriginal: boolean;
    nameAnonMatchOriginal: boolean;
    nameAnonMatchEnmascarado: boolean;
    resultadoFinal: string;
    obs?: string;
}

const resultadosGlobales: ResultadoV7[] = [];

if (fs.existsSync(PROGRESO_JSON)) {
    try {
        const saved = JSON.parse(fs.readFileSync(PROGRESO_JSON, 'utf-8'));
        resultadosGlobales.push(...saved);
        console.log(`🚀 Discovery V7: Cargadas ${resultadosGlobales.length} entradas previas.`);
    } catch (e) {
        console.error("❌ Error cargando JSON previo:", e);
    }
}

let allOriginales: RegistroEntrada[] = [];
let allEnmascarados: RegistroEntrada[] = [];

test.beforeAll(async () => {
    allOriginales = await leerExcelEntrada(EXCEL_FILE, 'Registros Originales');
    allEnmascarados = await leerExcelEntrada(EXCEL_FILE, 'Registros enmascarados');
});

test.afterAll(async () => {
    generarDashboardHTML(PROGRESO_JSON, DASHBOARD_HTM);
    await generarInformeProfesionalV7(PROGRESO_JSON, INFORME_V7);
    console.log('🏁 Proceso V7 finalizado. Reportes actualizados.');
});

const rawDataFile = path.join(process.cwd(), 'temp_registros.json');
const rawData = fs.existsSync(rawDataFile) ? JSON.parse(fs.readFileSync(rawDataFile, 'utf-8')) : { anon: [] };
const casos = (rawData.anon || []).filter((c: any) => c.rut && c.rut !== 'BUCPE_RUT');

test.describe('Validación V7 - Versión Definitiva', () => {
    // IMPORTANTE: Un solo worker para estabilidad secuencial
    test.describe.configure({ workers: 1 });

    casos.slice(0, LIMIT).forEach((caso: any) => {
        const rutInput = caso.rut; // Este es el RUT completo (Base+DV)

        test(`Validar RUT ${rutInput}`, async ({ page }) => {
            const yaProcesado = resultadosGlobales.find(r => r.rut === rutInput && r.resultadoFinal === 'OK');
            if (yaProcesado) {
                console.log(` skipping RUT ${rutInput} (ya existe OK)`);
                test.skip();
                return;
            }

            const regOrig = allOriginales.find(r => r.fullRut === rutInput);
            const regAnon = allEnmascarados.find(r => r.fullRut === rutInput);
            if (!regOrig || !regAnon) {
                test.skip();
                return;
            }

            const res: ResultadoV7 = {
                rut: rutInput,
                nombreOriginal: `${regOrig.nombre} ${regOrig.paterno} ${regOrig.materno}`,
                nombreEnmascarado: `${regAnon.nombre} ${regAnon.paterno} ${regAnon.materno}`,
                devueltoNoAnon: 'NO_ENCONTRADO',
                devueltoAnon: 'NO_ENCONTRADO',
                rutMatchNoAnon: false,
                rutMatchAnon: false,
                nameNoAnonMatchOriginal: false,
                nameAnonMatchOriginal: false,
                nameAnonMatchEnmascarado: false,
                resultadoFinal: 'ERROR: datos inconsistentes'
            };

            try {
                // 1. AMBIENTE NO_ANONIMIZADO
                await loginBUC(page, 'NO_ANONIMIZADA');
                const searchNoAnon = await buscarPorNombre(page, regOrig.nombre, regOrig.paterno, regOrig.materno);
                if (searchNoAnon.length > 0) {
                    const match = searchNoAnon[0];
                    res.devueltoNoAnon = match.nombre;
                    // match.rut ya está limpio por busqueda.ts, lo comparamos con rutInput (que es Base+DV)
                    res.rutMatchNoAnon = match.rut === rutInput;
                    res.nameNoAnonMatchOriginal = normalizarV7(match.nombre) === normalizarV7(res.nombreOriginal);
                }

                // 2. AMBIENTE ANONIMIZADO
                await loginBUC(page, 'ANONIMIZADA');
                const searchAnon = await buscarPorNombre(page, regAnon.nombre, regAnon.paterno, regAnon.materno);
                if (searchAnon.length > 0) {
                    const match = searchAnon[0];
                    res.devueltoAnon = match.nombre;
                    res.rutMatchAnon = match.rut === rutInput;
                    res.nameAnonMatchOriginal = normalizarV7(match.nombre) === normalizarV7(res.nombreOriginal);
                    res.nameAnonMatchEnmascarado = normalizarV7(match.nombre) === normalizarV7(res.nombreEnmascarado);
                }

                // REGLAS FINALES V7 (Strict equality)
                const normOriginal = normalizarV7(res.nombreOriginal);
                const normEnmascarado = normalizarV7(res.nombreEnmascarado);
                const normNoAnonFound = normalizarV7(res.devueltoNoAnon);
                const normAnonFound = normalizarV7(res.devueltoAnon);

                const okNoAnon = res.rutMatchNoAnon && res.nameNoAnonMatchOriginal && (normNoAnonFound !== normEnmascarado);
                const okAnon = res.rutMatchAnon && !res.nameAnonMatchOriginal && res.nameAnonMatchEnmascarado;

                if (okNoAnon && okAnon) {
                    res.resultadoFinal = 'OK';
                } else {
                    if (!res.rutMatchNoAnon || !res.rutMatchAnon) res.resultadoFinal = 'ERROR: RUT incorrecto';
                    else if (res.nameAnonMatchOriginal) res.resultadoFinal = 'ERROR: nombre coincide indebidamente';
                    else res.resultadoFinal = 'ERROR: datos inconsistentes';
                }

            } catch (err: any) {
                res.resultadoFinal = 'ERROR: Fallo Técnico';
                res.obs = err.message;
            }

            console.log(`[V7] RUT ${rutInput} -> ${res.resultadoFinal}`);
            const idx = resultadosGlobales.findIndex(r => r.rut === rutInput);
            if (idx >= 0) resultadosGlobales[idx] = res;
            else resultadosGlobales.push(res);
            fs.writeFileSync(PROGRESO_JSON, JSON.stringify(resultadosGlobales, null, 2));
        });
    });
});
