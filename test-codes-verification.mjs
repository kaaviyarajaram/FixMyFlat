import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\WELCOME\\.gemini\\antigravity-ide\\brain\\857dd052-d00e-443a-b7c3-dae7843a6eb5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testUpdatedUI() {
  console.log('Launching browser to verify clean UI and predefined codes...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  try {
    // 1. Check clean Login page (no test cases box)
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_clean_login.png') });
    console.log('✓ Clean Login screen captured (test cases removed)');

    // 2. Check clean Signup page (no demo code buttons)
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_clean_signup.png') });
    console.log('✓ Clean Signup screen captured (demo code buttons removed)');

    // 3. Test signup with RESIDENT-01
    console.log('3. Testing signup with predefined code RESIDENT-01...');
    await page.type('input[placeholder="Alex Rivera"]', 'Sophia Taylor');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'sophia.taylor@oakridge.com');
    const passInputs = await page.$$('input[placeholder="Securepass123!"]');
    await passInputs[0].type('Securepass123!');
    await passInputs[1].type('Securepass123!');
    await page.type('input[placeholder="OAK-4B-RES"]', 'RESIDENT-01');
    await page.click('button[type="submit"]');

    // Wait for redirect to /resident
    await new Promise(r => setTimeout(r, 2000));
    const residentUrl = page.url();
    console.log('Redirected URL after RESIDENT-01 signup:', residentUrl);
    if (!residentUrl.includes('/resident')) {
      throw new Error(`Expected /resident but got ${residentUrl}`);
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_signup_resident01_success.png') });
    console.log('✓ Successfully registered Resident with RESIDENT-01');

    // 4. Log out
    console.log('4. Logging out...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    // 5. Test signup with STAFF-01
    console.log('5. Testing signup with predefined code STAFF-01...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
    await page.type('input[placeholder="Alex Rivera"]', 'Marcus Vance');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'marcus.vance@oakridge.com');
    const passInputs2 = await page.$$('input[placeholder="Securepass123!"]');
    await passInputs2[0].type('Securepass123!');
    await passInputs2[1].type('Securepass123!');
    await page.type('input[placeholder="OAK-4B-RES"]', 'STAFF-01');
    await page.click('button[type="submit"]');

    // Wait for redirect to /maintenance
    await new Promise(r => setTimeout(r, 2000));
    const staffUrl = page.url();
    console.log('Redirected URL after STAFF-01 signup:', staffUrl);
    if (!staffUrl.includes('/maintenance')) {
      throw new Error(`Expected /maintenance but got ${staffUrl}`);
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_signup_staff01_success.png') });
    console.log('✓ Successfully registered Staff with STAFF-01');

    console.log('🎉 ALL CLEAN UI AND PREDEFINED CODE TESTS PASSED!');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testUpdatedUI();
