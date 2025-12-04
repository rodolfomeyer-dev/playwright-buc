import { test, expect } from '@playwright/test';

const USER = process.env.BUC_USER!;
const PASS = process.env.BUC_PASS!;

test('BUC - Búsqueda Avanzada por RUT: 7.627.650-1 → ÉXITO TOTAL Y DEFINITIVO', async ({ page }) => {
  // 1. Login directo
  await page.goto(`http://${USER}:${PASS}@192.168.84.40/FrontEnd/?usuEjeFor=${USER}`);

  // Defensa login formulario
  if (await page.locator('input[placeholder="Nombre de usuario"]').isVisible({ timeout: 5000 })) {
    await page.fill('input[placeholder="Nombre de usuario"]', USER);
    await page.fill('input[type="password"]', PASS);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button:has-text("Acceder")')
    ]);
  }

  // 2. Esperar página de búsqueda
  await expect(page.getByRole('heading', { name: /busqueda avanzada/i })).toBeVisible({ timeout: 20000 });

  // 3. Seleccionar opción RUT
  await page.selectOption('select', { label: 'CLIENTES POR SU RUT' });

  // 4. Campo RUT
  const campoRut = page.getByRole('textbox');
  await expect(campoRut).toBeEnabled({ timeout: 10000 });
  await campoRut.fill('7.627.650-1');

  // 5. CLIC EN EL BOTÓN BUSCAR → USANDO EL ID REAL DEL ELEMENTO (NUNCA FALLA)
  await page.click('#Buscar');
  // o si prefieres por clase + texto (también funciona):
  // await page.click('a.btn.blue:has-text("Buscar")');

  // 6. Esperar resultados
  await expect(page.getByText(/resultados de la búsqueda|detalle del cliente/i)).toBeVisible({ timeout: 25000 });

  // 7. Validar que el RUT esté visible
  await expect(page.getByText('7.627.650-1')).toBeVisible({ timeout: 10000 });

  // 8. Evidencia
  await page.screenshot({
    path: `evidencias/RUT_76276501_${new Date().toISOString().slice(0,10)}.png`,
    fullPage: true
  });

  console.log('¡BÚSQUEDA POR RUT 7.627.650-1 COMPLETADA CON ÉXITO ABSOLUTO!');
});