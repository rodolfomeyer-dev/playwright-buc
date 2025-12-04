import { test, expect } from '@playwright/test';

test('Abrir BUC con login directo', async ({ page }) => {
  await page.goto('http://192.168.84.40/FrontEnd/?usuEjeFor=mgarayv');

  // Verifica que la página cargue
  await expect(page).toHaveURL(/FrontEnd/);

  // Valida que aparezca algún texto del home
  await expect(page.getByText(/Consulta/i)).toBeVisible();
});
