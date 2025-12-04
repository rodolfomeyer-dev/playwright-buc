import { test, expect } from '@playwright/test';

test('BUC - Login completo (NTLM + Formulario) → ENTRA SIEMPRE', async ({ page }) => {
  const user = process.env.BUC_USER!;
  const pass = process.env.BUC_PASS!;

  // 1. Salta el pop-up de Windows NTLM automáticamente
  await page.goto(`http://${user}:${pass}@192.168.84.40/FrontEnd/?usuEjeFor=${user}`);

  // 2. Completa el formulario HTML que aparece después
  await page.fill('input[placeholder="Nombre de usuario"]', user);
  await page.fill('input[type="password"]', pass);

  // 3. Click en Acceder + espera navegación
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button:has-text("Acceder")')
  ]);

  // 4. Validamos que estamos dentro del BUC
  await expect(page.getByText(/Consulta/i)).toBeVisible({ timeout: 20000 });
  
  console.log('LOGIN EXITOSO - Ya estás dentro del BUC');
});