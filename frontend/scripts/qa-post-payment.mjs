import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const PASSWORD = 'Password@123';

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
}

const issues = [];

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Borrower status @ 375 with closed loan + payment history
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await login(page, 'borrower@lms.com');
    await page.goto(`${BASE}/apply/status`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (scroll > 2) issues.push({ route: '/apply/status', viewport: 375, issue: 'horizontal scroll', detail: `${scroll}px` });

    const closedBadge = await page.locator('text=Closed').count();
    if (!closedBadge) issues.push({ route: '/apply/status', viewport: 375, issue: 'Closed status not visible', detail: '' });

    const utr = page.locator('.font-mono').first();
    if (await utr.count()) {
      const overflow = await utr.evaluate((el) => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow === 'visible');
      const pageWide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      if (pageWide) issues.push({ route: '/apply/status', viewport: 375, issue: 'UTR caused page overflow', detail: await utr.textContent() });
    }

    if (errors.length) issues.push({ route: '/apply/status', viewport: 375, issue: 'console errors', detail: errors.join('; ') });
    await ctx.close();
  }

  // Collection history modal @ 375 with 40-char UTR
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await login(page, 'collection@lms.com');
    await page.goto(`${BASE}/dashboard/collection`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const historyBtn = page.getByRole('button', { name: 'History' }).first();
    if (await historyBtn.count()) {
      await historyBtn.click();
      await page.waitForTimeout(800);
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (scroll > 2) issues.push({ route: '/dashboard/collection history', viewport: 375, issue: 'horizontal scroll with modal', detail: `${scroll}px` });
      const dialog = page.locator('[role="dialog"]');
      const box = await dialog.boundingBox();
      if (box && box.height > 812) issues.push({ route: '/dashboard/collection history', viewport: 375, issue: 'modal taller than viewport', detail: `${Math.round(box.height)}px` });
    }
    await ctx.close();
  }

  await browser.close();
  console.log(JSON.stringify({ issues }, null, 2));
})();
