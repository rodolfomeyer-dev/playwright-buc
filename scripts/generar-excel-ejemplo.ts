import ExcelJS from 'exceljs';

/**
 * Script para generar Excel de ejemplo con estructura correcta
 */
async function generarExcelEjemplo() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RUTs a Validar');

    // Encabezados
    worksheet.columns = [
        { header: 'PNT_RUT', key: 'rut', width: 15 },
        { header: 'PNT_NOMBRE_COMPLETO', key: 'nombre', width: 40 },
    ];

    // Agregar datos de ejemplo (simulando la estructura real)
    const datosEjemplo = [
        { rut: '12345678', nombre: 'JUAN PEREZ GONZALEZ' },
        { rut: '23456789', nombre: 'MARIA RODRIGUEZ LOPEZ' },
        { rut: '34567890', nombre: 'PEDRO MARTINEZ SILVA' },
        { rut: '45678901', nombre: 'ANA FERNANDEZ TORRES' },
        { rut: '56789012', nombre: 'LUIS GARCIA MORALES' },
    ];

    datosEjemplo.forEach(registro => {
        worksheet.addRow(registro);
    });

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
    };

    // Guardar archivo
    await workbook.xlsx.writeFile('ruts-a-validar-ejemplo.xlsx');
    console.log('✅ Archivo de ejemplo creado: ruts-a-validar-ejemplo.xlsx');
    console.log('   Puedes renombrar o reemplazar este archivo con tus 494 RUTs reales');
}

generarExcelEjemplo().catch(console.error);
