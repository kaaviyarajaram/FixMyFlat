import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureScreens() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  
  // 1. Capture clean login page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:\\Users\\WELCOME\\.gemini\\antigravity-ide\\brain\\857dd052-d00e-443a-b7c3-dae7843a6eb5\\screen_verified_login.png' });

  // 2. Login as newly registered user
  await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'michael.scott@dundermifflin.com');
  await page.type('input[placeholder="••••••••••••"]', 'MyOfficePass2026!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  // 3. Capture authenticated dashboard
  await page.screenshot({ path: 'C:\\Users\\WELCOME\\.gemini\\antigravity-ide\\brain\\857dd052-d00e-443a-b7c3-dae7843a6eb5\\screen_resident_verified.png' });

  await browser.close();
  console.log('Screenshots captured successfully.');
}

captureScreens();
