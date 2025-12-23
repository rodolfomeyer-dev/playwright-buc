# Próximas funcionalidades a implementar

## 🎯 Corto plazo

- [x] Login dual (NTLM + formulario HTML)
- [x] Búsqueda en TEST y PROD
- [x] Comparación de nombres
- [x] Reporte Excel con colores
- [ ] Envío automático de reporte por correo
- [ ] Manejo de errores de red más robusto
- [ ] Logs detallados en archivo .log

## 📧 Envío de correos (próxima actualización)

Agregar integración con nodemailer para enviar el reporte automáticamente:

```typescript
// Ejemplo de configuración futura
const configCorreo = {
  destinatarios: ['equipo@empresa.cl'],
  asunto: 'Reporte de Anonimización - [FECHA]',
  cuerpo: 'Adjunto reporte de validación de anonimización',
  adjuntos: ['evidencias/REPORTE_ANONIMIZACION.xlsx']
};
```

## 🚀 Mediano plazo

- [ ] Dashboard web para ver resultados históricos
- [ ] Gráficos de tendencias (% anonimización por semana)
- [ ] Alertas si el % de anonimización baja del umbral
- [ ] Ejecución programada (cron/task scheduler)
- [ ] Reintento automático en caso de fallo
- [ ] Exportar a PDF además de Excel

## 🔮 Largo plazo

- [ ] API REST para consultar validaciones
- [ ] Integración con JIRA para crear tickets automáticos
- [ ] Notificaciones Slack/Teams
- [ ] Ejecución paralela optimizada (múltiples RUTs a la vez)
- [ ] Base de datos para historial completo
- [ ] Comparación con validaciones anteriores

## 💡 Ideas en evaluación

- Modo "watch" para validar RUTs nuevos automáticamente
- Validación de otros campos además del nombre
- Integración con CI/CD (Jenkins, GitHub Actions)
- Generación de métricas SLA

---

**¿Tienes ideas?** Agrégalas a este archivo o crea un issue.
