# BUC - Validación de Identidades (Versión 7 Definitiva) 🛡️🤖

Este proyecto automatiza la validación cruzada de identidades entre ambientes **ANONIMIZADOS** y **NO_ANONIMIZADOS** del portal BUC, utilizando Playwright y ExcelJS.

## 🚀 Versión 7 - Especificaciones Finales

La versión actual (V7) implementa reglas de negocio estrictas:
- **Concatenación de RUT**: Se utiliza `BUCPE_RUT + BUCPE_DV` para comparaciones de igualdad absoluta.
- **Normalización Minimalista**: Solo `toUpperCase()`, `trim()` y eliminación de tildes. No se reordenan palabras (Preserva la exactitud del portal).
- **Validación Cruzada**:
    - **NO_ANONIMIZADO**: RUT y Nombre deben coincidir con la planilla original. El nombre **no** debe ser el enmascarado.
    - **ANONIMIZADO**: RUT debe coincidir, pero el Nombre **no** debe ser el original y **sí** debe ser el enmascarado.

---

## 📁 Estructura del Proyecto

- `tests/validar-v7.spec.ts`: Core de validación con lógica de reintentos infinitos y modo resumable.
- `helpers/busqueda.ts`: Lógica de interacción con el portal y extracción dinámica de tablas.
- `helpers/excel.ts`: Utilidades para lectura de 500 registros y generación de reportes base.
- `scripts/generar-reporte-v7.ts`: Generador del **Informe Profesional de 11 columnas**.
- `scripts/generar-dashboard-v6.ts`: Generador del tablero web interactivo.
- `data/Ruts.xlsx`: Archivo fuente con las hojas "Registros Originales" y "Registros enmascarados".

---

## 🛠️ Cómo Ejecutar

### 1. Preparar Datos
Genera el archivo temporal para el test runner:
```powershell
npx ts-node scripts/preparar-datos-v6.ts
```

### 2. Ejecutar Piloto (5 registros)
```powershell
$env:LIMIT=5; npx playwright test tests/validar-v7.spec.ts --workers=1
```

### 3. Ejecutar Carga Completa (500 registros)
```powershell
$env:LIMIT=500; npx playwright test tests/validar-v7.spec.ts --workers=1
```

---

## 📊 Entregables Automáticos

Al finalizar cada ejecución, el robot genera automáticamente en la carpeta `evidencias/`:
1. **Informe_Validacion_BUC_V7_FINAL.xlsx**: Reporte ejecutivo con 11 columnas técnicas y celdas colorizadas.
2. **DASHBOARD_V7.html**: Tablero web para visualización rápida de resultados.
3. **Videos y Screenshots**: Evidencia visual completa de cada interacción en ambos ambientes.

---

## 🛡️ Manejo de Continuidad
El proyecto guarda el progreso en `PROGRESO_V7.json`. Si la VPN o la conexión fallan, simplemente reinicia el comando y el robot **saltará los registros ya validados exitosamente**, retomando desde el último punto de falla.

---
*Desarrollado para el equipo de Auditoría/QA - BUC*
