# 🔧 Solución al Error ERR_NETWORK_CHANGED

## ❌ Problema Original

```
Error: page.goto: net::ERR_NETWORK_CHANGED at http://192.168.84.40/...
```

### ¿Por qué ocurría?

El servidor BUC requiere **autenticación NTLM de Windows** que se manifiesta como un **popup de credenciales** ANTES de cargar la página web. 

Cuando Playwright intenta navegar, el popup NTLM bloquea la navegación y genera el error `ERR_NETWORK_CHANGED`.

## ✅ Solución Implementada

### Autenticación en 2 Capas

1. **Capa 1 - NTLM (popup de Windows)**
   - Se maneja con `httpCredentials` en el contexto del navegador
   - Esto "salta" el popup automáticamente

2. **Capa 2 - Formulario HTML (en la página web)**
   - Se maneja con la función `loginBUC()` 
   - Llena usuario, contraseña y hace clic en "Acceder"

### Código Actualizado

```typescript
// Crear contexto CON credenciales HTTP
const context = await browser.newContext({
    httpCredentials: {
        username: 'mgarayv',      // Para TEST
        password: 'Equipo111',
    },
});
const page = await context.newPage();

// Ahora SÍ puede navegar (el popup NTLM ya fue manejado)
await loginBUC(page, 'TEST');
```

## 📝 Cambios Realizados

### Archivos Modificados

1. **test-simple.spec.ts**
   - ✅ Agregado `httpCredentials` para TEST
   - ✅ Agregado `httpCredentials` para PROD

2. **validar-anonimizacion.spec.ts**
   - ✅ Agregado `httpCredentials` en loop de TEST
   - ✅ Agregado `httpCredentials` en loop de PROD

### Función loginBUC() (sin cambios)

La función `loginBUC()` en `helpers/login.ts` **NO cambió**. Sigue:
1. Navegando a la URL
2. Esperando el formulario HTML
3. Llenando usuario y contraseña
4. Haciendo clic en "Acceder"

La diferencia es que AHORA puede navegar porque el popup NTLM ya fue manejado por `httpCredentials`.

## 🚀 Ejecutar Nuevamente

```bash
# Test simple (debería funcionar ahora)
npm run test:headed -- tests/test-simple.spec.ts

# Test completo
npm run test:headed -- tests/validar-anonimizacion.spec.ts
```

## 📊 Flujo Completo

```
┌─────────────────────────────────────┐
│ 1. Browser Context con             │
│    httpCredentials                  │
│    ↓                               │
│    Maneja popup NTLM               │
│    automáticamente                  │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│ 2. page.goto(URL)                  │
│    ↓                               │
│    Navega sin problema              │
│    (popup ya fue manejado)          │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│ 3. loginBUC() llena formulario     │
│    ↓                               │
│    - Espera formulario HTML         │
│    - Llena usuario                  │
│    - Llena contraseña              │
│    - Clic en "Acceder"             │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────┐
│ 4. ✅ Login exitoso                │
│    Página principal BUC             │
└─────────────────────────────────────┘
```

## 🎯 Resumen

- **Problema:** Popup NTLM bloqueaba navegación
- **Solución:** `httpCredentials` en contexto del navegador
- **Resultado:** Las credenciales se ingresan en 2 capas:
  1. HTTP credentials (automático para NTLM)
  2. Formulario web (manual con loginBUC)

¡Ahora debería funcionar! 🚀
