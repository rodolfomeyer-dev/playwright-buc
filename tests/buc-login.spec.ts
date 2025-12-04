import { test, expect } from '@playwright/test';

test('BUC - Login completo → ENTRA SIEMPRE', async ({ page }) => {
  const user = process.env.BUC_USER!;
  const pass = process.env.BUC_PASS!;

  // Salta el pop-up de Windows automáticamente
  await page.goto(`http://${user}:${pass}@192.168.84.40/FrontEnd/?usuEjeFor=${user}`);

  // Rellena el formulario que aparece después
  await page.fill('input[placeholder="Nombre de usuario"]', user);
  await page.fill('input[type="password"]', pass);

  // Click en Acceder y espera
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button:has-text("Acceder")')
  ]);

  // Confirma que ya estás dentro
  await expect(page.getByText(/Consulta/i)).toBeVisible({ timeout: 20000 });
  
  console.log('¡LOGIN EXITOSO! Ya estás dentro del BUC');
});