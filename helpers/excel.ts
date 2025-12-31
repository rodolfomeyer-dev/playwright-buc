
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

export function normalizarV7(txt: string): string {
    return (txt || "")
        .toUpperCase()
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar tildes
}

/**
 * Representa una fila de entrada desde el Excel (V6 Strict Mode)
 */
export interface RegistroEntrada {
    rut: string;
    dv: string;
    fullRut?: string;
    nombre: string;
    paterno: string;
    materno: string;
    nombreCompletoRef?: string;
}

/**
 * Resultado de validación unificada (Lado a Lado)
 */
export interface ResultadoSideBySide {
    RUT: string;
    'Nombre Esperado (Planilla)': string;
    'N. Encontrado (ANON)': string;
    'RUT Encontrado (ANON)': string;
    'N. Encontrado (NO ANON)': string;
    'RUT Encontrado (NO ANON)': string;
    'Coinciden?': string;
    'Observaciones'?: string;
}

/**
 * Extrae el valor de una celda como string de forma segura
 */
function getCellValueAsString(cell: ExcelJS.Cell): string {
    const value = cell.value;
    if (value === null || value === undefined) return "";
    if (typeof value === 'object') {
        if ('result' in value) return String(value.result || "");
        if ('richText' in value) return value.richText.map(rt => rt.text).join("");
        if ('text' in value) return String(value.text || "");
    }
    return String(value);
}

/**
 * Lee la hoja especificada del Excel con mapeo V6 (Columnas 3 a 8)
 */
export async function leerExcelEntrada(
    filePath: string,
    sheetName: string
): Promise<RegistroEntrada[]> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
        throw new Error(`Hoja "${sheetName}" no encontrada en ${filePath}`);
    }

    console.log(`\n✅ Leyendo hoja: "${worksheet.name}" (V6/V7 Strict Mode)`);

    const registros: RegistroEntrada[] = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < 2) return; // Saltar cabecera

        const rutBase = getCellValueAsString(row.getCell(3)).trim();
        const dv = getCellValueAsString(row.getCell(4)).trim();
        const paterno = getCellValueAsString(row.getCell(5)).trim();
        const materno = getCellValueAsString(row.getCell(6)).trim();
        const nombres = getCellValueAsString(row.getCell(7)).trim();
        const nombreRef = getCellValueAsString(row.getCell(8)).trim();

        if (rutBase && rutBase !== '[object Object]' && !rutBase.includes('BUCPE_RUT') && !rutBase.includes('COD_MARCA')) {
            registros.push({
                rut: rutBase,
                dv: dv,
                fullRut: rutBase + dv,
                nombre: nombres,
                paterno: paterno,
                materno: materno,
                nombreCompletoRef: nombreRef
            });
        }
    });

    console.log(`📊 Excel cargado: ${registros.length} registros encontrados`);
    return registros;
}

/**
 * Genera el reporte Excel Lado a Lado (v6.0)
 */
export async function generarReporteExcelSideBySide(
    resultados: ResultadoSideBySide[],
    rutaSalida: string
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Validación BUC');

    worksheet.columns = [
        { header: 'RUT', key: 'RUT', width: 15 },
        { header: 'Nombre Planilla', key: 'Nombre Esperado (Planilla)', width: 35 },
        { header: 'Nombre ANON', key: 'N. Encontrado (ANON)', width: 35 },
        { header: 'Nombre NO ANON', key: 'N. Encontrado (NO ANON)', width: 35 },
        { header: 'Coinciden?', key: 'Coinciden?', width: 12 },
        { header: 'Observaciones', key: 'Observaciones', width: 40 }
    ];

    resultados.forEach(res => {
        const row = worksheet.addRow(res);
        const cell = row.getCell(5);
        if (res['Coinciden?'] === 'SÍ') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
            cell.font = { color: { argb: 'FF006100' } };
        } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
            cell.font = { color: { argb: 'FF9C0006' } };
        }
    });

    const dir = path.dirname(rutaSalida);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await workbook.xlsx.writeFile(rutaSalida);
    console.log(`📄 Reporte Excel generado: ${rutaSalida}`);
}
