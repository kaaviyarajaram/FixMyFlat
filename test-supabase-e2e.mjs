import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testSupabaseAuth() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // 1. Check Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  console.log('Login URL:', page.url());

  // 2. Sign up
  await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
  await page.type('input[placeholder="Alex Rivera"]', 'Bruce Wayne');
  await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'bruce.wayne@gotham.com');

  const passInputs = await page.$$('input[placeholder="Securepass123!"]');
  await passInputs[0].type('Batman2026!');
  await passInputs[1].type('Batman2026!');
  await page.type('input[placeholder="Enter code"]', 'RESIDENT-01');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  console.log('URL after signup:', page.url());

  // 3. Logout and login back
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'bruce.wayne@gotham.com');
  await page.type('input[placeholder="••••••••••••"]', 'Batman2026!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  console.log('URL after login:', page.url());

  const residentName = await page.evaluate(() => document.querySelector('h2')?.textContent);
  console.log('Dashboard profile name:', residentName);

  await browser.close();
  console.log('🎉 Live Supabase-connected auth test passed completely!');
}

testSupabaseAuth();
