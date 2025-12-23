# 🔧 Solución Error 403 en PROD

## ❌ Problema Actual
Error 403 en PROD: `http://192.168.154.54:8070/HpUxaLinux/BUC/buc/error403.aspx`

Esto significa que la autenticación NTLM con `httpCredentials` no está funcionando en PROD.

## ✅ Credenciales Correctas (confirmadas)
- Usuario: `pruebas-bas2`
- Password: `Equipo.1125#`

## 🔍 Diagnóstico

Las credenciales están correctamente configuradas en el código, pero hay 2 posibles causas:

### Causa 1: httpCredentials no funciona en este servidor PROD
El servidor puede requerir credenciales directamente en la URL.

### Causa 2: Servidor requiere dominio en el usuario
Algunos servidores NTLM requieren: `DOMINIO\usuario` en lugar de solo `usuario`

## 🛠️ Soluciones a Probar

### Solución 1: Usar credenciales en URL (más probable)

Modifica `helpers/login.ts` línea 37:

**CAMBIAR ESTO:**
```typescript
await page.goto(config.url, {
    timeout: 120000,
    waitUntil: 'domcontentloaded',
});
```

**POR ESTO:**
```typescript
// Para PROD, usar credenciales en URL
const urlFinal = entorno === 'PROD' 
    ? config.url.replace('http://', `http://${config.usuario}:${config.passwordEncoded}@`)
    : config.url;

await page.goto(urlFinal, {
    timeout: 120000,
    waitUntil: 'domcontentloaded',
});
```

### Solución 2: Probar con dominio (menos probable)

Si la Solución 1 no funciona, puede que necesites agregar un dominio al usuario.

Modifica `helpers/login.ts` línea 16:

**CAMBIAR:**
```typescript
usuario: 'pruebas-bas2',
```

**POR (pregunta al admin del servidor cuál es el dominio):**
```typescript
usuario: 'DOMINIO\\pruebas-bas2',  // Reemplaza DOMINIO por el real
```

## 🧪 Test Rápido

Para verificar cuál funciona, puedes probar manualmente en el navegador:

1. Abre Chrome/Edge
2. Navega a: `http://pruebas-bas2:Equipo.1125%23@192.168.154.54:8070/HpUxaLinux/BUC/buc/`
3. Si funciona → Solución 1 es correcta
4. Si pide credenciales → Solución 2 puede ser necesaria

## 📝 Aplicar la Solución

¿Cuál prefieres que implemente?
- [ ] Solución 1: Credenciales en URL para PROD
- [ ] Solución 2: Agregar dominio al usuario
- [ ] Ambas (intentar 1, si falla probar 2)

---

**Recomendación:** Empezar con Solución 1, que es la más común.
