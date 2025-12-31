
import { leerExcelEntrada } from '../helpers/excel';
import path from 'path';
import fs from 'fs';

async function preparar() {
    console.log('🚧 Preparando datos para V7 (Full RUT)...');
    const EXCEL_FILE = path.join(process.cwd(), 'data', 'Ruts.xlsx');

    const allOriginales = await leerExcelEntrada(EXCEL_FILE, 'Registros Originales');

    const registrosV7 = allOriginales
        .filter(r => r.rut !== 'BUCPE_RUT' && r.rut !== 'PNT_RUT')
        .map(r => ({
            rut: r.fullRut, // Aquí pasamos el RUT COMPETETO para el test runner
            nombre: r.nombre,
            paterno: r.paterno,
            materno: r.materno
        }));

    const data = {
        anon: registrosV7
    };

    fs.writeFileSync('temp_registros.json', JSON.stringify(data, null, 2));
    console.log(`💾 Datos guardados en temp_registros.json (${registrosV7.length} registros con full RUT)`);
}

preparar();
