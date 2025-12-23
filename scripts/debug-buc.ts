import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // CREDENTIALS
    const USER = 'pruebas-bas2';
    const PASS = 'Equipo.1125#';
    const PASS_ENCODED = encodeURIComponent(PASS);
    const url = `http://${USER}:${PASS_ENCODED}@192.168.154.221:8070/HpUxaLinux/BUC/buc/?usuEjeFor=mgarayv`;

    console.log(`Navigating to: ${url.replace(PASS_ENCODED, '***')}`);

    try {
        await page.goto(url, { timeout: 30000 });
        console.log('Page loaded.');
        console.log('Title:', await page.title());

        const select = page.locator('select#opcion');
        if (await select.isVisible()) {
            await select.selectOption('Rut');
            console.log('Selected Rut');
        }

        const input = page.locator('input#aguja');
        if (await input.isVisible()) {
            await input.fill('13684895');
            console.log('Filled RUT 13684895');

            await input.press('Enter');
            console.log('Pressed Enter');

            await page.waitForTimeout(3000);

            // Dump inputs again to see if page changed
            const inputsAfter = await page.locator('input').count();
            console.log(`Inputs count after Enter: ${inputsAfter}`);

            // Try Form Submit if likely same page
            try {
                const form = page.locator('#form1');
                if (await form.count() > 0) {
                    console.log('Attempting direct form submission on #form1...');
                    await form.evaluate((f: any) => f.submit());

                    await page.waitForTimeout(5000);
                    console.log('Waited 5s after submit');
                }
            } catch (e) { console.log('Form submit error:', e); }
        }

        const content = await page.content();
        console.log('Content Body Preview:', content.substring(0, 5000));

        // List key elements
        const elements = await page.locator('button, a, input[type="button"], input[type="submit"], table').all();
        console.log(`Found ${elements.length} key elements:`);
        for (const el of elements) {
            const tag = await el.evaluate(e => e.tagName);
            const id = await el.getAttribute('id');
            const cls = await el.getAttribute('class');
            const txt = await el.innerText();
            console.log(` - Tag: ${tag}, ID: ${id}, Class: ${cls}, Text: "${txt.trim()}"`);
        }

        await page.screenshot({ path: 'debug-results.png' });

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
})();
