import ExcelJS from 'exceljs';
import fs from 'fs';

/**
 * Estructura de datos de entrada (Excel original)
 */
export interface RegistroEntrada {
    rut: string;
    nombreEsperado: string;
}

/**
 * Resultado de validación completa TEST vs PROD
 */
export interface ResultadoValidacion {
    RUT: string;
    'Nombre esperado': string;
    'Nombre en TEST': string;
    'Nombre en PROD': string;
    'ANONIMIZADO TEST': string;
    'ANONIMIZADO PROD': string;
    'ESTADO FINAL': string;
}

/**
 * Lee el archivo Excel de entrada con RUTs a validar
 * 
 * @param rutaExcel - Ruta al archivo Excel
 * @returns Array de registros con RUT y nombre esperado
 */
export async function leerExcelEntrada(rutaExcel: string): Promise<RegistroEntrada[]> {
    if (!fs.existsSync(rutaExcel)) {
        throw new Error(`❌ Archivo no encontrado: ${rutaExcel}`);
    }

    console.log(`\n📁 Abriendo archivo: ${rutaExcel}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(rutaExcel);

    // Usar la primera hoja disponible
    const sheet = workbook.worksheets[0];

    if (!sheet) {
        throw new Error(`❌ No se encontró ninguna hoja en el Excel`);
    }

    console.log(`\n✅ Leyendo hoja: "${sheet.name}" (${sheet.rowCount} filas)`);

    const registros: RegistroEntrada[] = [];

    // Encontrar índices de columnas (Header en Fila 2)
    const headerRow = sheet.getRow(2);
    let colRutIndex = -1;
    let colDvIndex = -1;
    let colNombreIndex = -1;
    let colPaternoIndex = -1;
    let colMaternoIndex = -1;

    headerRow.eachCell((cell, colNumber) => {
        const header = (cell.value?.toString() || '').trim();
        if (header === 'BUCPE_RUT') colRutIndex = colNumber;
        if (header === 'BUCPE_DV') colDvIndex = colNumber;
        if (header === 'BUCPE_NATNOMBRE') colNombreIndex = colNumber;
        if (header === 'BUCPE_NATPATERNO') colPaternoIndex = colNumber;
        if (header === 'BUCPE_NATMATERNO') colMaternoIndex = colNumber;
    });

    if (colRutIndex === -1) {
        throw new Error(`❌ No se encontró columna BUCPE_RUT`);
    }

    console.log(`   Columnas encontradas: RUT(${colRutIndex}), NOMBRE(${colNombreIndex}), PATERNO(${colPaternoIndex}), MATERNO(${colMaternoIndex})`);

    sheet.eachRow((row, rowNumber) => {
        // Saltar filas de header (1 y 2)
        if (rowNumber <= 2) return;

        const rutCell = row.getCell(colRutIndex);
        const rutValue = (rutCell.text || rutCell.value?.toString() || '').trim();

        if (rutValue && rutValue !== '[object Object]') {
            // Obtener DV (si la columna existe)
            let rutFinal = rutValue;
            if (colDvIndex !== -1) {
                const dv = (row.getCell(colDvIndex).value?.toString() || '').trim();
                // Si hay DV, lo usamos. Concatenamos con guión según práctica común
                if (dv) {
                    rutFinal = `${rutValue}-${dv}`;
                }
            }

            // Construir nombre completo
            const nombre = colNombreIndex !== -1 ? (row.getCell(colNombreIndex).value?.toString() || '').trim() : '';
            const paterno = colPaternoIndex !== -1 ? (row.getCell(colPaternoIndex).value?.toString() || '').trim() : '';
            const materno = colMaternoIndex !== -1 ? (row.getCell(colMaternoIndex).value?.toString() || '').trim() : '';

            // Formato: NOMBRE PATERNO MATERNO (Ajustar si es necesario)
            const nombreCompleto = [nombre, paterno, materno].filter(Boolean).join(' ');

            registros.push({
                rut: rutFinal,
                nombreEsperado: nombreCompleto
            });
        }
    });

    console.log(`\n📊 Excel cargado: ${registros.length} registros encontrados`);

    if (registros.length > 0) {
        console.log(`\n   Primeros 3 registros:`);
        registros.slice(0, 3).forEach((reg, idx) => {
            console.log(`   ${idx + 1}. RUT: "${reg.rut}" | Nombre: "${reg.nombreEsperado}"`);
        });
    }

    return registros;
}

/**
 * Genera el reporte Excel final con formato condicional
 * 
 * @param resultados - Array de resultados de validación
 * @param rutaSalida - Ruta donde guardar el reporte
 */
export async function generarReporteExcel(
    resultados: ResultadoValidacion[],
    rutaSalida: string
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Anonimización');

    // Definir columnas
    worksheet.columns = [
        { header: 'RUT', key: 'RUT', width: 15 },
        { header: 'Nombre esperado', key: 'Nombre esperado', width: 35 },
        { header: 'Nombre en TEST', key: 'Nombre en TEST', width: 35 },
        { header: 'Nombre en PROD', key: 'Nombre en PROD', width: 35 },
        { header: 'ANONIMIZADO TEST', key: 'ANONIMIZADO TEST', width: 18 },
        { header: 'ANONIMIZADO PROD', key: 'ANONIMIZADO PROD', width: 18 },
        { header: 'ESTADO FINAL', key: 'ESTADO FINAL', width: 20 },
    ];

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos con formato condicional
    resultados.forEach((resultado) => {
        const row = worksheet.addRow(resultado);

        // Color para ANONIMIZADO TEST
        const cellTest = row.getCell('ANONIMIZADO TEST');
        cellTest.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: resultado['ANONIMIZADO TEST'] === 'SÍ' ? 'FF00FF00' : 'FFFF0000',
            },
        };
        cellTest.font = { bold: true, color: { argb: 'FF000000' } };

        // Color para ANONIMIZADO PROD
        const cellProd = row.getCell('ANONIMIZADO PROD');
        cellProd.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: resultado['ANONIMIZADO PROD'] === 'NO' ? 'FF00FF00' : 'FFFF0000',
            },
        };
        cellProd.font = { bold: true, color: { argb: 'FF000000' } };

        // Color para ESTADO FINAL
        const cellEstado = row.getCell('ESTADO FINAL');
        const esValido = resultado['ESTADO FINAL'] === '✅ VÁLIDO';
        cellEstado.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: esValido ? 'FF92D050' : 'FFFFC000' },
        };
        cellEstado.font = { bold: true, color: { argb: 'FF000000' } };
    });

    // Crear directorio si no existe
    const path = require('path');
    const directorioSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(directorioSalida)) {
        fs.mkdirSync(directorioSalida, { recursive: true });
    }

    // Guardar archivo
    await workbook.xlsx.writeFile(rutaSalida);
    console.log(`\n📄 Reporte generado: ${rutaSalida}`);
}
