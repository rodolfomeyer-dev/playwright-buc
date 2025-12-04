import { test } from '@playwright/test';

test('DEBUG: ¿Playwright lee el .env?', async () => {
  console.log('→ BUC_USER =', process.env.BUC_USER);
  console.log('→ BUC_PASS =', process.env.BUC_PASS);
  console.log('Si ves mgarayv y Equipo111 arriba → TODO ESTÁ PERFECTO');
});