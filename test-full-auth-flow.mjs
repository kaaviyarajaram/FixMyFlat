import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFullAuthFlow() {
  console.log('🚀 Running Comprehensive Persistent Signup & Login Test...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  try {
    // 1. Check Root Redirect to Login
    console.log('\n--- Test 1: Root route lands on /login ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    console.log('Current URL on open:', page.url());
    if (!page.url().includes('/login')) {
      throw new Error(`Expected /login, got ${page.url()}`);
    }
    console.log('✓ Root URL cleanly opened Login page.');

    // 2. Register New Resident Account
    console.log('\n--- Test 2: Register New Resident (michael.scott@dundermifflin.com) ---');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });

    await page.type('input[placeholder="Alex Rivera"]', 'Michael Scott');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'michael.scott@dundermifflin.com');
    
    const passInputs = await page.$$('input[placeholder="Securepass123!"]');
    await passInputs[0].type('MyOfficePass2026!');
    await passInputs[1].type('MyOfficePass2026!');

    await page.type('input[placeholder="RESIDENT-01 or STAFF-01"]', 'RESIDENT-01');
    await page.click('button[type="submit"]');

    // Wait for redirect to /resident
    await new Promise(r => setTimeout(r, 2000));
    console.log('URL after signup:', page.url());
    if (!page.url().includes('/resident')) {
      throw new Error(`Expected /resident after signup, got ${page.url()}`);
    }
    console.log('✓ Successfully registered and redirected to /resident.');

    // 3. Verify Server-Side Disk Persistence in data/db.json
    console.log('\n--- Test 3: Verify data physically stored in data/db.json on disk ---');
    const dbRaw = fs.readFileSync(path.resolve('./data/db.json'), 'utf-8');
    const db = JSON.parse(dbRaw);
    const diskAccount = db.accounts.find(a => a.email === 'michael.scott@dundermifflin.com');
    if (!diskAccount) {
      throw new Error('Account was NOT saved in data/db.json on the server disk!');
    }
    console.log('✓ Account verified in data/db.json with email:', diskAccount.email);
    console.log('✓ Stored password on disk:', diskAccount.password === 'MyOfficePass2026!' ? 'MATCHES' : 'MISMATCH');
    if (diskAccount.password !== 'MyOfficePass2026!') {
      throw new Error('Password mismatch in database file!');
    }

    // 4. Test Logout and Login with Wrong Password
    console.log('\n--- Test 4: Logout and Login with Wrong Password ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'michael.scott@dundermifflin.com');
    await page.type('input[placeholder="••••••••••••"]', 'WrongPass999!');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1000));
    const errorText = await page.evaluate(() => document.body.innerText);
    if (!errorText.includes('Incorrect password')) {
      throw new Error(`Expected "Incorrect password" error, got: ${errorText}`);
    }
    console.log('✓ Incorrect password correctly rejected.');

    // 5. Test Login with Correct Password
    console.log('\n--- Test 5: Login with Correct Password ---');
    await page.click('input[placeholder="••••••••••••"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="••••••••••••"]', 'MyOfficePass2026!');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1500));
    console.log('URL after login:', page.url());
    if (!page.url().includes('/resident')) {
      throw new Error(`Expected /resident after login, got ${page.url()}`);
    }
    const residentName = await page.evaluate(() => document.querySelector('h2')?.textContent);
    console.log('Profile name on dashboard:', residentName);
    if (!residentName?.includes('Michael Scott')) {
      throw new Error(`Expected Michael Scott, got ${residentName}`);
    }
    console.log('✓ Successfully logged in with newly registered account!');

    // 6. Test in a Fresh Incognito / Cleared Storage Context
    console.log('\n--- Test 6: Verify Login in a Fresh Context (Simulating New Browser / Incognito) ---');
    const freshContext = await browser.createBrowserContext();
    const freshPage = await freshContext.newPage();

    await freshPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await freshPage.type('input[placeholder="alex.rivera@oakridge.com"]', 'michael.scott@dundermifflin.com');
    await freshPage.type('input[placeholder="••••••••••••"]', 'MyOfficePass2026!');
    await freshPage.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1500));
    console.log('Fresh context URL after login:', freshPage.url());
    if (!freshPage.url().includes('/resident')) {
      throw new Error(`Expected /resident in fresh context, got ${freshPage.url()}`);
    }
    console.log('✓ Confirmed login succeeds in completely fresh context from server database!');
    await freshContext.close();

    // 7. Test Staff Registration and Login
    console.log('\n--- Test 7: Register & Login New Staff (dwight.schrute@dundermifflin.com) ---');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });

    await page.type('input[placeholder="Alex Rivera"]', 'Dwight Schrute');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'dwight.schrute@dundermifflin.com');
    
    const staffPassInputs = await page.$$('input[placeholder="Securepass123!"]');
    await staffPassInputs[0].type('BeetFarming2026!');
    await staffPassInputs[1].type('BeetFarming2026!');

    await page.type('input[placeholder="RESIDENT-01 or STAFF-01"]', 'STAFF-01');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 2000));
    console.log('URL after staff signup:', page.url());
    if (!page.url().includes('/maintenance')) {
      throw new Error(`Expected /maintenance after staff signup, got ${page.url()}`);
    }
    console.log('✓ Staff account registered and routed to /maintenance.');

    // Logout and log back in as staff
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'dwight.schrute@dundermifflin.com');
    await page.type('input[placeholder="••••••••••••"]', 'BeetFarming2026!');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1500));
    console.log('URL after staff login:', page.url());
    if (!page.url().includes('/maintenance')) {
      throw new Error(`Expected /maintenance after staff login, got ${page.url()}`);
    }
    const staffProfileName = await page.evaluate(() => document.querySelector('h2')?.textContent);
    console.log('Staff profile name on dashboard:', staffProfileName);
    if (!staffProfileName?.includes('Dwight Schrute')) {
      throw new Error(`Expected Dwight Schrute, got ${staffProfileName}`);
    }
    console.log('✓ Staff login verified and working 100%!');

    console.log('\n🎉 ALL TESTS PASSED! PERSISTENT SIGNUP AND LOGIN IS FULLY FIXED!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFullAuthFlow();
