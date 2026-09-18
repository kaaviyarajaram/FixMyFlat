import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyLiveSignupToSupabase() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  const uniqueEmail = 'resident_check_' + Date.now() + '@oakridge.com';
  console.log('Testing app signup with:', uniqueEmail);

  await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
  await page.type('input[placeholder="Alex Rivera"]', 'Tony Stark');
  await page.type('input[placeholder="alex.rivera@oakridge.com"]', uniqueEmail);

  const passInputs = await page.$$('input[placeholder="Securepass123!"]');
  await passInputs[0].type('Ironman2026!');
  await passInputs[1].type('Ironman2026!');
  await page.type('input[placeholder="Enter code"]', 'RESIDENT-01');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3500));
  console.log('Browser URL after signup:', page.url());

  await browser.close();

  // Verify in Supabase
  const headers = {
    'apikey': 'sb_publishable_iibzqy67mryUjKGYEkgrwQ_V88WXkAz',
    'Authorization': 'Bearer sb_publishable_iibzqy67mryUjKGYEkgrwQ_V88WXkAz'
  };
  const res = await fetch('https://swlhqczzwocvibjjokdn.supabase.co/rest/v1/profiles?email=eq.' + uniqueEmail + '&select=*', { headers });
  const data = await res.json();
  console.log('Verified in Supabase profiles:', data);
}

verifyLiveSignupToSupabase();
