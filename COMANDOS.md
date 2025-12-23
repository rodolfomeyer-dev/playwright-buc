# 🎯 Comandos Rápidos - Copiar y Pegar

## 🚀 Instalación Inicial (una sola vez)

```bash
npm install
npx playwright install chromium
```

## 📊 Generar Excel de Ejemplo

```bash
npx ts-node scripts/generar-excel-ejemplo.ts
mv ruts-a-validar-ejemplo.xlsx ruts-a-validar.xlsx
```

## 🧪 Tests

### Test simple (2-3 minutos) - RECOMENDADO PRIMERO
```bash
npm run test:headed -- tests/test-simple.spec.ts
```

### Test completo con todos los RUTs (varias horas)
```bash
npm run test:headed -- tests/validar-anonimizacion.spec.ts
```

### Ejecutar en background (sin ver navegador)
```bash
npm test
```

### Solo probar login en TEST
```bash
npm run test:headed -- tests/test-simple.spec.ts --grep "TEST"
```

### Solo probar login en PROD
```bash
npm run test:headed -- tests/test-simple.spec.ts --grep "PROD"
```

## 📈 Ver Reportes

### Ver reporte HTML de Playwright
```bash
npm run report
```

### Abrir el reporte Excel generado
```bash
start evidencias/REPORTE_ANONIMIZACION.xlsx
```

## 🐛 Debug

### Ejecutar en modo debug paso a paso
```bash
npm run test:debug
```

### Ver capturas de pantalla de errores
```bash
start test-results/
```

## 📁 Limpiar Archivos Generados

```bash
# Limpiar reportes y capturas
Remove-Item -Recurse -Force test-results, playwright-report, evidencias

# Recrear carpeta evidencias
New-Item -ItemType Directory -Force -Path evidencias
```

## ⚙️ Configuración

### Ver versión de Playwright instalada
```bash
npx playwright --version
```

### Verificar TypeScript
```bash
npx tsc --version
```

### Listar todos los tests disponibles
```bash
npx playwright test --list
```

## 📊 Reducir RUTs para Prueba

### Abrir Excel y copiar primeras 10 filas
```powershell
# En PowerShell, abrir el Excel de ejemplo
start ruts-a-validar-ejemplo.xlsx
```

## 🔥 Atajos más usados

```bash
# 1. Generar Excel de ejemplo y renombrar
npx ts-node scripts/generar-excel-ejemplo.ts && mv ruts-a-validar-ejemplo.xlsx ruts-a-validar.xlsx

# 2. Test simple viendo el navegador
npm run test:headed -- tests/test-simple.spec.ts

# 3. Test completo en background
npm test

# 4. Ver reporte
npm run report
```

---

**Copia y pega estos comandos directamente en tu terminal PowerShell** 🚀
