import ExcelJS from 'exceljs';
import path from 'path';

/**
 * Valida un RUT chileno usando el algoritmo módulo 11
 * @param rut RUT sin dígito verificador
 * @param dv Dígito verificador esperado
 * @returns true si el RUT es válido
 */
function validarRutChileno(rut: string, dv: string): boolean {
    // Limpiar el RUT de puntos y espacios
    const rutLimpio = rut.replace(/\./g, '').replace(/\s/g, '');

    // Algoritmo módulo 11
    let suma = 0;
    let multiplicador = 2;

    // Recorrer el RUT de derecha a izquierda
    for (let i = rutLimpio.length - 1; i >= 0; i--) {
        suma += parseInt(rutLimpio[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dvCalculado = 11 - resto;

    let dvEsperado: string;
    if (dvCalculado === 11) {
        dvEsperado = '0';
    } else if (dvCalculado === 10) {
        dvEsperado = 'K';
    } else {
        dvEsperado = dvCalculado.toString();
    }

    // Comparar (ignorar mayúsculas/minúsculas)
    return dvEsperado.toLowerCase() === dv.toLowerCase();
}

/**
 * Procesa un valor BUCPE_RUT según las instrucciones:
 * 1. Elimina el último dígito
 * 2. El último dígito que queda es el dígito verificador
 * 3. Valida si es un RUT válido
 */
function procesarBUCPE_RUT(valorOriginal: any): {
    valorOriginal: string;
    sinUltimo: string;
    rutBase: string;
    dv: string;
    esValido: boolean;
    dvCalculado: string;
} {
    // Convertir a string y limpiar
    const valorStr = String(valorOriginal).replace(/\./g, '').replace(/\s/g, '');

    // 1. Eliminar el último dígito
    const sinUltimo = valorStr.slice(0, -1);

    // 2. El último número que queda es el dígito verificador
    const dv = sinUltimo.slice(-1);
    const rutBase = sinUltimo.slice(0, -1);

    // 3. Validar si es un RUT válido
    const esValido = validarRutChileno(rutBase, dv);

    // Calcular el DV correcto para reportar
    let suma = 0;
    let multiplicador = 2;
    for (let i = rutBase.length - 1; i >= 0; i--) {
        suma += parseInt(rutBase[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const resto = suma % 11;
    const dvCalc = 11 - resto;
    let dvCalculado: string;
    if (dvCalc === 11) {
        dvCalculado = '0';
    } else if (dvCalc === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvCalc.toString();
    }

    return {
        valorOriginal: valorStr,
        sinUltimo,
        rutBase,
        dv,
        esValido,
        dvCalculado
    };
}

async function analizarHoja(
    workbook: ExcelJS.Workbook,
    nombreHoja: string,
    nombreArchivo: string
): Promise<void> {
    const worksheet = workbook.getWorksheet(nombreHoja);

    if (!worksheet) {
        console.error(`❌ No se encontró la hoja "${nombreHoja}"`);
        return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Analizando hoja: ${nombreHoja}`);
    console.log(`${'='.repeat(60)}\n`);

    // Encontrar la columna BUCPE_RUT
    let columnaRUT: number | null = null;
    const primeraFila = worksheet.getRow(1);

    primeraFila.eachCell((cell, colNumber) => {
        if (cell.text.includes('BUCPE_RUT')) {
            columnaRUT = colNumber;
        }
    });

    if (!columnaRUT) {
        console.error('❌ No se encontró la columna BUCPE_RUT');
        return;
    }

    console.log(`📍 Columna BUCPE_RUT encontrada: ${String.fromCharCode(64 + columnaRUT)}\n`);

    // Analizar los RUTs
    const resultados: any[] = [];
    let totalValidos = 0;
    let totalInvalidos = 0;

    for (let i = 2; i <= worksheet.rowCount; i++) {
        const cell = worksheet.getRow(i).getCell(columnaRUT);
        const valor = cell.value;

        if (!valor) continue;

        const resultado = procesarBUCPE_RUT(valor);
        resultados.push({
            fila: i,
            ...resultado
        });

        if (resultado.esValido) {
            totalValidos++;
        } else {
            totalInvalidos++;
        }
    }

    // Mostrar resumen
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total de RUTs analizados: ${resultados.length}`);
    console.log(`✅ RUTs válidos:          ${totalValidos} (${((totalValidos / resultados.length) * 100).toFixed(1)}%)`);
    console.log(`❌ RUTs inválidos:        ${totalInvalidos} (${((totalInvalidos / resultados.length) * 100).toFixed(1)}%)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Mostrar primeros 10 ejemplos
    console.log('📋 PRIMEROS 10 EJEMPLOS:\n');
    for (let i = 0; i < Math.min(10, resultados.length); i++) {
        const r = resultados[i];
        const icono = r.esValido ? '✅' : '❌';
        console.log(`${icono} Fila ${r.fila}:`);
        console.log(`   Original:     ${r.valorOriginal}`);
        console.log(`   Sin último:   ${r.sinUltimo}`);
        console.log(`   RUT base:     ${r.rutBase}`);
        console.log(`   DV extraído:  ${r.dv}`);
        console.log(`   DV calculado: ${r.dvCalculado}`);
        console.log(`   Válido:       ${r.esValido ? 'SÍ' : 'NO'}\n`);
    }

    // Generar reporte Excel
    const reporteWorkbook = new ExcelJS.Workbook();
    const reporteWorksheet = reporteWorkbook.addWorksheet(`Análisis - ${nombreHoja}`);

    // Encabezados
    reporteWorksheet.columns = [
        { header: 'Fila', key: 'fila', width: 10 },
        { header: 'Valor Original', key: 'valorOriginal', width: 15 },
        { header: 'Sin Último Dígito', key: 'sinUltimo', width: 15 },
        { header: 'RUT Base', key: 'rutBase', width: 12 },
        { header: 'DV Extraído', key: 'dv', width: 12 },
        { header: 'DV Calculado', key: 'dvCalculado', width: 15 },
        { header: 'Es Válido', key: 'esValido', width: 12 }
    ];

    // Datos
    resultados.forEach(r => {
        reporteWorksheet.addRow({
            fila: r.fila,
            valorOriginal: r.valorOriginal,
            sinUltimo: r.sinUltimo,
            rutBase: r.rutBase,
            dv: r.dv,
            dvCalculado: r.dvCalculado,
            esValido: r.esValido ? 'SÍ' : 'NO'
        });
    });

    // Formato condicional
    reporteWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            // Encabezado
            row.font = { bold: true };
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        } else {
            // Colorear según validez
            const esValido = row.getCell('esValido').value === 'SÍ';
            row.getCell('esValido').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: esValido ? 'FFC6EFCE' : 'FFFFC7CE' }
            };
            row.getCell('esValido').font = {
                color: { argb: esValido ? 'FF006100' : 'FF9C0006' }
            };
        }
    });

    // Guardar reporte
    const nombreReporte = `ANALISIS_RUTS_${nombreHoja.replace(/\s+/g, '_')}.xlsx`;
    const rutaReporte = path.join(process.cwd(), 'evidencias', nombreReporte);
    await reporteWorkbook.xlsx.writeFile(rutaReporte);

    console.log(`\n✅ Reporte generado: ${rutaReporte}`);
    console.log('\n📈 CONCLUSIÓN:');
    if (totalInvalidos === 0) {
        console.log('   ✅ Todos los RUTs son válidos');
    } else {
        console.log(`   ⚠️  Hay ${totalInvalidos} RUT(s) inválido(s) que necesitan corrección`);
    }
}

async function analizarRUTs() {
    console.log('🔍 ANÁLISIS DE RUTs - Planilla Original\n');

    // Buscar el archivo específico
    const nombreArchivo = 'RUTS_BUC_PERSONA_original.xlsx';
    const rutaCompleta = path.join(process.cwd(), nombreArchivo);

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(rutaCompleta);
        console.log(`✅ Archivo encontrado: ${nombreArchivo}\n`);

        // Hojas a analizar
        const hojasAAnalizar = ['Valores Originales', 'Valores enmascarados'];

        for (const nombreHoja of hojasAAnalizar) {
            await analizarHoja(workbook, nombreHoja, nombreArchivo);
        }

        console.log('\n\n' + '='.repeat(60));
        console.log('✅ ANÁLISIS COMPLETADO');
        console.log('='.repeat(60));
        console.log('Se han generado los siguientes reportes:');
        hojasAAnalizar.forEach(hoja => {
            const nombreReporte = `ANALISIS_RUTS_${hoja.replace(/\s+/g, '_')}.xlsx`;
            console.log(`   📄 evidencias/${nombreReporte}`);
        });

    } catch (error) {
        console.error(`❌ Error al leer el archivo ${nombreArchivo}:`);
        console.error(error);
        console.log('\nAsegúrate de que el archivo existe en el directorio actual.');
    }
}

// Ejecutar
analizarRUTs().catch(console.error);
