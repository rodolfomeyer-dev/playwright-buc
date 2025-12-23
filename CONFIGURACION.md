# Configuración del Proyecto

## Variables de Entorno (Opcional)

Si prefieres no tener las credenciales en el código, puedes crear un archivo `.env`:

```env
# Entorno TEST
TEST_URL=http://192.168.84.40/FrontEnd/?usuEjeFor=mgarayv
TEST_USER=mgarayv
TEST_PASS=Equipo111

# Entorno PROD
PROD_URL=http://192.168.154.54:8070/HpUxaLinux/BUC/buc/?usuEjeFor=pruebas-bas2
PROD_USER=pruebas-bas2
PROD_PASS=Equipo.1125#
```

Luego instala `dotenv`:
```bash
npm install dotenv
```

Y modifica `helpers/login.ts` para leer de `.env` en lugar de tener las credenciales hardcodeadas.

## Timeouts Configurables

Edita `playwright.config.ts` para ajustar los timeouts según tu red:

```typescript
use: {
  actionTimeout: 30000,      // ← Tiempo para clicks, fills, etc.
  navigationTimeout: 120000, // ← Tiempo para cargar páginas (2 min)
},
timeout: 300000, // ← Timeout total por test (5 min)
```

## Selectores Personalizables

Si los selectores cambian (botones, campos), edítalos en:

- **Login:** `helpers/login.ts` → busca `input[placeholder*="Nombre de usuario"]`
- **Búsqueda:** `helpers/busqueda.ts` → busca `#Buscar` y `select`

## Ejecución Paralela

Por defecto, el test ejecuta **secuencialmente** (1 worker) para evitar sobrecarga.

Si quieres ejecutar varios RUTs en paralelo (más rápido pero más demanda en el servidor):

```typescript
// playwright.config.ts
workers: 3, // ← Cambiar de 1 a 3 o más
```

⚠️ **Advertencia:** Esto puede causar errores si el servidor BUC no soporta múltiples conexiones simultáneas del mismo usuario.

## Formato del Reporte

El reporte Excel usa estos colores (editables en `helpers/excel.ts`):

- **Verde (00FF00):** Comportamiento correcto
- **Rojo (FF0000):** Comportamiento incorrecto
- **Naranja (FFC000):** Requiere revisión

## Logs Personalizados

Para agregar más logs, usa `console.log()` en cualquier helper o test.

Para guardar logs en archivo:

```bash
npm test > logs/ejecucion.log 2>&1
```

## Integración con CI/CD

Para ejecutar en Jenkins/GitHub Actions:

```yaml
# Ejemplo para GitHub Actions
- name: Run Tests
  run: npm test
  env:
    CI: true
```

El modo CI ya está configurado para:
- 2 reintentos en caso de fallo
- Reporte JUnit en `test-results/junit.xml`
