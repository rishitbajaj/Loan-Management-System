/**
 * Browser QA against Windows dev server (http://172.20.10.2:3000).
 * API expected at http://localhost:5000/api from the browser (Windows host).
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const API = process.env.QA_API_URL ?? 'http://localhost:5000/api';
const PASSWORD = 'Password@123';

const ACCOUNTS = [
  { role: 'admin', email: 'admin@lms.com', nav: ['Overview', 'Sales', 'Sanction', 'Disbursement', 'Collection'] },
  { role: 'sales', email: 'sales@lms.com', nav: ['Sales'] },
  { role: 'sanction', email: 'sanction@lms.com', nav: ['Sanction'] },
  { role: 'disbursement', email: 'disbursement@lms.com', nav: ['Disbursement'] },
  { role: 'collection', email: 'collection@lms.com', nav: ['Collection'] },
  { role: 'borrower', email: 'borrower@lms.com', nav: [] },
];

const VIEWPORTS = [375, 390, 768, 1200, 1440];

const ROUTES = {
  public: ['/', '/login', '/register'],
  admin: ['/dashboard', '/dashboard/sales', '/dashboard/sanction', '/dashboard/disbursement', '/dashboard/collection'],
  borrower: ['/apply/personal-details', '/apply/salary-slip', '/apply/loan', '/apply/status'],
};

const issues = [];
const tested = { routes: new Set(), viewports: new Set(), roles: new Set() };

function record(issue, route, viewport, detail) {
  issues.push({ issue, route, viewport, detail });
}

async function login(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function checkPageScroll(page, route, viewport) {
  const { scrollW, clientW, scrollH, clientH } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
  }));
  if (scrollW > clientW + 2) {
    record('Horizontal page scroll', route, viewport, `${scrollW}px > ${clientW}px`);
  }
  tested.routes.add(route);
  tested.viewports.add(viewport);
}

async function checkConsole(page, route) {
  // collected via listener
}

async function getNavLabels(page) {
  return page.locator('nav ul li a').allTextContents();
}

async function apiLogin(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`API login failed for ${email}: ${json.message}`);
  return json.data;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  // --- Public pages ---
  for (const w of [375, 768, 1200]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ text: msg.text(), url: page.url() });
    });
    for (const route of ROUTES.public) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(500);
        await checkPageScroll(page, route, w);
      } catch (e) {
        record('Page load failed', route, w, e.message.slice(0, 120));
      }
    }
    await ctx.close();
  }

  // --- RBAC per role ---
  for (const account of ACCOUNTS) {
    tested.roles.add(account.role);
    const ctx = await browser.newContext({ viewport: { width: 768, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ text: msg.text(), url: page.url() });
    });

    try {
      await login(page, account.email);
      const url = page.url();

      if (account.role === 'borrower') {
        if (!url.includes('/apply')) record('Borrower redirect wrong', '/login', 768, url);
      } else if (account.role === 'admin') {
        if (!url.includes('/dashboard')) record('Admin redirect wrong', '/login', 768, url);
      } else {
        if (!url.includes('/dashboard/')) record(`${account.role} redirect wrong`, '/login', 768, url);
      }

      if (account.role !== 'borrower') {
        await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1500);
        const nav = (await getNavLabels(page)).map((t) => t.trim()).filter(Boolean);
        for (const expected of account.nav) {
          if (!nav.includes(expected)) record('Missing nav item', '/dashboard', 768, `${account.role} missing "${expected}"; got [${nav.join(', ')}]`);
        }
        for (const label of nav) {
          if (!account.nav.includes(label)) record('Extra nav item', '/dashboard', 768, `${account.role} unexpected "${label}"`);
        }

        // Unauthorized module access
        const forbidden = ROUTES.admin.filter((r) => {
          if (account.role === 'admin') return false;
          const mod = r.split('/').pop();
          return mod !== account.role;
        });
        for (const route of forbidden.slice(0, 2)) {
          await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(1500);
          if (page.url().includes(route) && account.role !== 'admin') {
            record('RBAC bypass — stayed on forbidden route', route, 768, `${account.role} at ${page.url()}`);
          }
        }
      }
    } catch (e) {
      record('Role login/test failed', account.role, 768, e.message.slice(0, 120));
    }
    await ctx.close();
  }

  // --- Borrower 375px flow ---
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await login(page, 'borrower@lms.com');
    for (const route of ROUTES.borrower) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      await checkPageScroll(page, route, 375);
      const stepper = page.locator('nav[aria-label="Application progress"]');
      if (await stepper.count()) {
        const box = await stepper.boundingBox();
        if (box && box.width > 375 + 2) {
          const stepperScroll = await stepper.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
          if (!stepperScroll) record('Stepper overflows viewport without local scroll', route, 375, `width ${Math.round(box.width)}`);
        }
      }
    }
    await ctx.close();
  }

  // --- Ops pages at key widths ---
  for (const w of [768, 1200, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await login(page, 'admin@lms.com');
    for (const route of ROUTES.admin) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      await checkPageScroll(page, route, w);
    }
    await ctx.close();
  }

  // --- Modal QA at 375px (sanction reject, collection if data exists) ---
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await login(page, 'sanction@lms.com');
    await page.goto(`${BASE}/dashboard/sanction`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const rejectBtn = page.getByRole('button', { name: 'Reject' }).first();
    if (await rejectBtn.count()) {
      await rejectBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.count()) {
        const box = await dialog.boundingBox();
        if (box && (box.width > 375 || box.x < 0)) record('Reject modal exceeds viewport', '/dashboard/sanction', 375, JSON.stringify(box));
        const { scrollW, clientW } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
        }));
        if (scrollW > clientW + 2) record('Page scroll after modal open', '/dashboard/sanction', 375, `${scrollW}px`);
        await page.keyboard.press('Escape');
      }
    } else {
      record('Could not test Reject modal', '/dashboard/sanction', 375, 'No Reject button (no pending loans?)');
    }
    await ctx.close();
  }

  // --- Collection payment history UTR at 375px ---
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await login(page, 'collection@lms.com');
    await page.goto(`${BASE}/dashboard/collection`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await checkPageScroll(page, '/dashboard/collection', 375);
    const historyBtn = page.getByRole('button', { name: 'History' }).first();
    if (await historyBtn.count()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
      await checkPageScroll(page, '/dashboard/collection (history modal)', 375);
      const utr = page.locator('.font-mono').first();
      if (await utr.count()) {
        const utrBox = await utr.boundingBox();
        if (utrBox && utrBox.width > 375) record('UTR text expands beyond viewport', '/dashboard/collection', 375, `width ${Math.round(utrBox.width)}`);
        const hasTruncate = await utr.evaluate((el) => {
          const s = getComputedStyle(el);
          return s.overflow === 'hidden' || s.wordBreak === 'break-all' || s.overflowWrap === 'anywhere';
        });
        if (!hasTruncate) {
          const long = await utr.evaluate((el) => el.scrollWidth > el.clientWidth + 2);
          if (long) record('Long UTR not truncated/wrapped', '/dashboard/collection', 375, await utr.textContent());
        }
      }
    }
    await ctx.close();
  }

  // --- API E2E smoke (backend state) ---
  let e2e = { ok: false, steps: [] };
  try {
    const borrower = await apiLogin('borrower@lms.com');
    e2e.steps.push('borrower login ok');
    // Check existing loan state only — do not mutate if closed pipeline exists
    const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${borrower.token}` } });
    const me = await meRes.json();
    e2e.steps.push(`borrower me: ${me.success ? 'ok' : me.message}`);
    e2e.ok = me.success;
  } catch (e) {
    e2e.error = e.message;
  }

  await browser.close();

  console.log(
    JSON.stringify(
      {
        base: BASE,
        api: API,
        tested: {
          routes: [...tested.routes],
          viewports: [...tested.viewports],
          roles: [...tested.roles],
        },
        issues,
        consoleErrors: consoleErrors.slice(0, 20),
        e2e,
      },
      null,
      2,
    ),
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
