
# 🤖 Automatización BUC - Validación de Anonimización

Sistema de automatización con Playwright para validar que los datos de clientes estén correctamente anonimizados en el entorno de TEST comparándolos con PRODUCCIÓN.

## 📋 ¿Qué hace este proyecto?

1. **Lee un Excel** con RUTs y nombres de clientes
2. **Busca cada RUT** en dos entornos:
   - **TEST** (http://192.168.84.40) → Debería tener datos anonimizados
   - **PROD** (http://192.168.154.54:8070) → Tiene datos reales
3. **Compara los resultados** y valida que TEST esté anonimizado
4. **Genera un reporte Excel** con formato condicional (verde/rojo)

## 🔐 Autenticación

El sistema usa **autenticación por formulario web HTML**:

1. Navega a la URL del entorno (TEST o PROD)
2. Espera a que aparezca el formulario de login
3. Ingresa las credenciales en los campos:
   - Campo "Nombre de usuario"
   - Campo de contraseña (type="password")
4. Hace clic en el botón "Acceder"
5. Verifica que se haya accedido correctamente buscando el texto "Búsqueda avanzada"

**Nota:** Las credenciales están configuradas en `helpers/login.ts` y se ingresan automáticamente en el formulario de la página web.

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar navegadores de Playwright
npx playwright install chromium
```

## 📁 Estructura del proyecto

```
.
├── helpers/               # Funciones reutilizables
│   ├── login.ts          # Login por formulario HTML web
│   ├── busqueda.ts       # Búsqueda por RUT en BUC
│   └── excel.ts          # Lectura/escritura de Excel
├── tests/
│   └── validar-anonimizacion.spec.ts  # Test principal
├── scripts/
│   └── generar-excel-ejemplo.ts       # Genera Excel de ejemplo
├── ruts-a-validar.xlsx   # ← DEBES CREAR ESTE ARCHIVO
└── evidencias/           # Reportes generados (se crea automáticamente)
```

## 📊 Preparar el Excel de entrada

### Opción 1: Usar el ejemplo
```bash
# Generar Excel de ejemplo con 5 RUTs
npx ts-node scripts/generar-excel-ejemplo.ts

# Renombrarlo para usar en el test
mv ruts-a-validar-ejemplo.xlsx ruts-a-validar.xlsx
```

### Opción 2: Crear tu propio Excel
Crea un archivo `ruts-a-validar.xlsx` con esta estructura:

| PNT_RUT  | PNT_NOMBRE_COMPLETO    |
|----------|------------------------|
| 12345678 | JUAN PEREZ GONZALEZ    |
| 23456789 | MARIA RODRIGUEZ LOPEZ  |
| ...      | ...                    |

**Notas importantes:**
- Primera fila = encabezados
- Columna A = RUT (solo números, sin puntos ni guiones)
- Columna B = Nombre completo real (el que debería estar en PROD)

## 🧪 Ejecutar el test

### Ejecución normal (headless)
```bash
npm test
```

### Ver el navegador en acción
```bash
npm run test:headed
```

### Modo debug paso a paso
```bash
npm run test:debug
```

### Ver reporte HTML
```bash
npm run report
```

## 📄 Reporte generado

El test genera un Excel en: `evidencias/REPORTE_ANONIMIZACION.xlsx`

**Columnas:**
- `RUT` - RUT del cliente
- `Nombre esperado` - Nombre real que debería estar en PROD
- `Nombre en TEST` - Lo que encontró en TEST
- `Nombre en PROD` - Lo que encontró en PROD
- `ANONIMIZADO TEST` - 🟢 SÍ / 🔴 NO
- `ANONIMIZADO PROD` - 🟢 NO / 🔴 SÍ (esperamos que NO esté anonimizado)
- `ESTADO FINAL` - ✅ VÁLIDO / ⚠️ REVISAR

**Formato condicional:**
- 🟢 Verde = Comportamiento correcto
- 🔴 Rojo = Comportamiento incorrecto
- 🟡 Naranja = Requiere revisión manual

## ⚙️ Configuración de entornos

Las credenciales están en `helpers/login.ts`:

```typescript
ENTORNOS = {
  TEST: {
    url: 'http://192.168.84.40/FrontEnd/?usuEjeFor=mgarayv',
    usuario: 'mgarayv',
    password: 'Equipo111',
  },
  PROD: {
    url: 'http://192.168.154.54:8070/HpUxaLinux/BUC/buc/?usuEjeFor=pruebas-bas2',
    usuario: 'pruebas-bas2',
    password: 'Equipo.1125#',
  },
}
```

## 🐛 Solución de problemas

### Error: "Falta ruts-a-validar.xlsx"
Debes crear el archivo Excel de entrada (ver [Preparar el Excel](#-preparar-el-excel-de-entrada))

### Timeouts frecuentes
Los servidores BUC son lentos. Ya está configurado con:
- 120 segundos para navegación
- 5 minutos timeout total por test

Si aún falla, edita `playwright.config.ts` y aumenta los valores.

### Nombres no encontrados
Verifica que:
1. El selector de búsqueda sea "CLIENTES POR SU RUT"
2. El RUT esté sin puntos ni guiones
3. El servidor esté disponible (ping a las IPs)

## 📈 Próximas mejoras

- [ ] Envío automático de reporte por correo
- [ ] Dashboard web con resumen visual
- [ ] Ejecución paralela optimizada
- [ ] Integración con CI/CD
- [ ] Notificaciones Slack/Teams

## 🤝 Contribuir

Este proyecto está en desarrollo activo. Para agregar nuevos tests:

1. Crea un nuevo archivo en `tests/`
2. Importa los helpers de `helpers/`
3. Sigue la estructura del test principal

## 📞 Soporte

Para dudas o problemas, revisar los logs del test que muestran:
- URL de cada conexión
- RUT buscado
- Nombre encontrado
- Estado de anonimización

---

**Última actualización:** Diciembre 2025

