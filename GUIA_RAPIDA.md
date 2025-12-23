# Guía Rápida de Uso

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Preparar el Excel con tus RUTs

Tienes dos opciones:

**A) Usar tus 494 RUTs reales:**
- Crea/copia tu archivo Excel como `ruts-a-validar.xlsx`
- Asegúrate de que tenga dos columnas: `PNT_RUT` y `PNT_NOMBRE_COMPLETO`

**B) Probar con el ejemplo (5 RUTs):**
```bash
npx ts-node scripts/generar-excel-ejemplo.ts
mv ruts-a-validar-ejemplo.xlsx ruts-a-validar.xlsx
```

### 2️⃣ Ejecutar el test

```bash
# Ver el navegador en acción (recomendado la primera vez)
npm run test:headed

# O ejecutar en modo headless (más rápido)
npm test
```

### 3️⃣ Ver el reporte

El reporte se genera automáticamente en: `evidencias/REPORTE_ANONIMIZACION.xlsx`

Abrelo con Excel y verás:
- 🟢 Verde = Todo correcto
- 🔴 Rojo = Hay un problema
- Columna "ESTADO FINAL" te dice si cada RUT pasó la validación

## ⏱️ ¿Cuánto tarda?

Con 494 RUTs:
- **Cada RUT** se busca en 2 entornos (TEST + PROD)
- **Tiempo por RUT:** ~30-60 segundos (los servidores son lentos)
- **Tiempo total estimado:** 4-8 horas

💡 **Tip:** Empieza con 10-20 RUTs para probar, luego ejecuta el lote completo.

## 🎯 Comandos más útiles

```bash
# Ver el navegador trabajando
npm run test:headed

# Ejecutar rápido sin UI
npm test

# Debug paso a paso (útil para ver qué falla)
npm run test:debug

# Ver reporte HTML de Playwright
npm run report
```

## 🔍 Interpretar el reporte

El Excel final tiene estas columnas:

| Columna | Qué significa |
|---------|---------------|
| RUT | El RUT del cliente |
| Nombre esperado | El nombre real que pusiste en el Excel de entrada |
| Nombre en TEST | Lo que encontró en el entorno de TEST |
| Nombre en PROD | Lo que encontró en el entorno de PROD |
| ANONIMIZADO TEST | 🟢 SÍ = Está anonimizado (correcto)<br>🔴 NO = No está anonimizado (error) |
| ANONIMIZADO PROD | 🟢 NO = Tiene nombre real (correcto)<br>🔴 SÍ = Está anonimizado (error) |
| ESTADO FINAL | ✅ VÁLIDO = Todo OK<br>⚠️ REVISAR = Hay algo raro |

## 🐛 Problemas comunes

### No encuentra el archivo Excel
```
Error: Falta ruts-a-validar.xlsx
```
**Solución:** Genera el archivo de ejemplo o copia tu Excel real con ese nombre.

### Timeout / Se queda colgado
Los servidores BUC son LENTOS. El test ya está configurado para esperar hasta 5 minutos por operación.

Si aún falla:
1. Verifica que puedas acceder manualmente a las URLs
2. Reduce el número de RUTs para probar
3. Ejecuta en horarios de menor carga

### Error de login
```
Error: text=/busqueda avanzada/i not found
```
**Solución:** 
- Verifica las credenciales en `helpers/login.ts`
- Revisa que la VPN esté activa (si aplica)
- Prueba acceder manualmente primero

## 📊 Reducir el Excel para pruebas

Si quieres probar con menos RUTs antes de ejecutar los 494:

1. Abre tu `ruts-a-validar.xlsx`
2. Copia solo las primeras 10-20 filas a un nuevo Excel
3. Guárdalo como `ruts-a-validar.xlsx`
4. Ejecuta el test
5. Cuando funcione, usa el Excel completo

## 📧 ¿Y el envío por correo?

Próximamente. Por ahora:
1. El test genera el Excel en `evidencias/`
2. Lo adjuntas manualmente a tu correo
3. Envías a quien corresponda

(Más adelante agregaremos envío automático)

---

**¿Dudas?** Revisa el README.md completo o los comentarios en el código.
