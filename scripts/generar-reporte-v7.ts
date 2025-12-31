
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

export async function generarInformeProfesionalV7(jsonPath: string, outputPath: string) {
    if (!fs.existsSync(jsonPath)) {
        console.error('No se encontró el archivo de progreso V7.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Robot AntiGravity';
    workbook.lastModifiedBy = 'Robot AntiGravity';
    workbook.created = new Date();

    // --- 1. PORTADA ---
    const wsPortada = workbook.addWorksheet('Portada');
    wsPortada.getCell('B2').value = 'Informe de Validación Cruzada DEFINITIVO (V7)';
    wsPortada.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF1E40AF' } };

    wsPortada.getCell('B4').value = 'Fecha de ejecución:';
    wsPortada.getCell('C4').value = new Date().toLocaleString();

    wsPortada.getCell('B5').value = 'Registros procesados:';
    wsPortada.getCell('C5').value = data.length;

    wsPortada.getCell('B6').value = 'Responsable:';
    wsPortada.getCell('C6').value = 'Robot AntiGravity (V7 Strict)';

    // --- 2. RESUMEN ---
    const okCount = data.filter((r: any) => r.resultadoFinal === 'OK').length;
    const errorCount = data.length - okCount;

    const wsResumen = workbook.addWorksheet('Resumen Ejecutivo');
    wsResumen.addRow(['Métrica', 'Valor']).font = { bold: true };
    wsResumen.addRow(['Total Registros', data.length]);
    wsResumen.addRow(['Éxito (OK)', okCount]);
    wsResumen.addRow(['Fallos (ERROR)', errorCount]);
    wsResumen.addRow(['% Eficacia', data.length > 0 ? ((okCount / data.length) * 100).toFixed(1) + '%' : '0%']);

    // --- 3. TABLA DETALLADA (11 COLUMNAS) ---
    const wsDetalle = workbook.addWorksheet('Detalle de Validación');
    wsDetalle.addRow([
        'RUT',
        'Nombre Original',
        'Nombre Enmascarado',
        'Nombre devuelto NO_ANON',
        'Nombre devuelto ANON',
        'Coincide RUT NO_ANON',
        'Coincide RUT ANON',
        'N. NO_ANON vs Original',
        'N. ANON vs Original',
        'N. ANON vs Enmascarado',
        'RESULTADO FINAL'
    ]);

    const header = wsDetalle.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

    data.forEach((r: any) => {
        const row = wsDetalle.addRow([
            r.rut,
            r.nombreOriginal,
            r.nombreEnmascarado,
            r.devueltoNoAnon,
            r.devueltoAnon,
            r.rutMatchNoAnon ? 'Sí' : 'No',
            r.rutMatchAnon ? 'Sí' : 'No',
            r.nameNoAnonMatchOriginal ? 'Sí' : 'No',
            r.nameAnonMatchOriginal ? 'Sí' : 'No',
            r.nameAnonMatchEnmascarado ? 'Sí' : 'No',
            r.resultadoFinal
        ]);

        const lastCell = row.getCell(11);
        if (r.resultadoFinal === 'OK') {
            lastCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
            lastCell.font = { color: { argb: 'FF006100' }, bold: true };
        } else {
            lastCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
            lastCell.font = { color: { argb: 'FF9C0006' }, bold: true };
        }
    });

    wsDetalle.columns.forEach((col, i) => {
        col.width = i === 0 ? 15 : 30;
    });

    // --- 4. DATOS BRUTOS ---
    const wsBrutos = workbook.addWorksheet('Datos Brutos');
    if (data.length > 0) {
        wsBrutos.addRow(Object.keys(data[0])).font = { bold: true };
        data.forEach((r: any) => wsBrutos.addRow(Object.values(r)));
    }

    await workbook.xlsx.writeFile(outputPath);
    console.log(`✅ Informe V7 creado en: ${outputPath}`);
}

// Ejecución directa
if (require.main === module) {
    const json = process.argv[2] || 'evidencias/PROGRESO_V7.json';
    const out = process.argv[3] || 'evidencias/Informe_Validacion_BUC_V7_FINAL.xlsx';
    generarInformeProfesionalV7(json, out);
}
