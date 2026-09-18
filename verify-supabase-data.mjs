import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifySupabaseLiveInsert() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  const testEmail = 'resident_live_' + Date.now() + '@oakridge.com';
  console.log('Testing live signup with:', testEmail);

  await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
  await page.type('input[placeholder="Alex Rivera"]', 'Peter Parker');
  await page.type('input[placeholder="alex.rivera@oakridge.com"]', testEmail);

  const passInputs = await page.$$('input[placeholder="Securepass123!"]');
  await passInputs[0].type('Spiderman2026!');
  await passInputs[1].type('Spiderman2026!');
  await page.type('input[placeholder="Enter code"]', 'RESIDENT-01');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3500));
  console.log('URL after signup:', page.url());

  await browser.close();

  // Now check Supabase REST API directly to verify user was created in profiles!
  const headers = {
    'apikey': 'sb_publishable_iibzqy67mryUjKGYEkgrwQ_V88WXkAz',
    'Authorization': 'Bearer sb_publishable_iibzqy67mryUjKGYEkgrwQ_V88WXkAz'
  };
  const pRes = await fetch('https://swlhqczzwocvibjjokdn.supabase.co/rest/v1/profiles?email=eq.' + testEmail + '&select=*', { headers });
  const profiles = await pRes.json();
  console.log('Found profile in Supabase profiles table:', profiles);
}

verifySupabaseLiveInsert();
