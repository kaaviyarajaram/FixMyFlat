import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testPersistedLogin() {
  console.log('Starting verification of persistent account registration and login...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  try {
    // 1. Register new Resident
    console.log('1. Registering new resident account (david.miller@myapartments.com)...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
    await page.type('input[placeholder="Alex Rivera"]', 'David Miller');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'david.miller@myapartments.com');
    const passInputs = await page.$$('input[placeholder="Securepass123!"]');
    await passInputs[0].type('MyPassword2026!');
    await passInputs[1].type('MyPassword2026!');
    await page.type('input[placeholder="OAK-4B-RES"]', 'RESIDENT-01');
    await page.click('button[type="submit"]');

    // Wait for redirect to /resident
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL after registration:', page.url());
    if (!page.url().includes('/resident')) {
      throw new Error(`Expected /resident after signup, got ${page.url()}`);
    }
    console.log('✓ Resident account created and routed to /resident');

    // 2. Sign out
    console.log('2. Signing out...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    // 3. Test login with wrong password
    console.log('3. Testing login with wrong password...');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'david.miller@myapartments.com');
    await page.type('input[placeholder="••••••••••••"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 800));

    const pageText = await page.evaluate(() => document.body.innerText);
    if (!pageText.includes('Incorrect password')) {
      throw new Error('Expected "Incorrect password" error message on invalid password attempt!');
    }
    console.log('✓ Rejected invalid password with helpful error message');

    // 4. Test login with correct password
    console.log('4. Testing login with correct password...');
    // Clear password input
    await page.click('input[placeholder="••••••••••••"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder="••••••••••••"]', 'MyPassword2026!');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1500));
    console.log('Current URL after logging back in:', page.url());
    if (!page.url().includes('/resident')) {
      throw new Error(`Expected /resident after login, got ${page.url()}`);
    }
    const residentName = await page.evaluate(() => document.querySelector('h2')?.textContent);
    console.log('Loaded resident profile name:', residentName);
    if (!residentName?.includes('David Miller')) {
      throw new Error(`Expected profile name "David Miller", got "${residentName}"`);
    }
    console.log('✓ Successfully logged in with newly registered resident account!');

    // 5. Register new Staff
    console.log('5. Registering new staff account (elena.rostova@facilitycare.com)...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
    await page.type('input[placeholder="Alex Rivera"]', 'Elena Rostova');
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'elena.rostova@facilitycare.com');
    const passInputsStaff = await page.$$('input[placeholder="Securepass123!"]');
    await passInputsStaff[0].type('StaffSecret2026!');
    await passInputsStaff[1].type('StaffSecret2026!');
    await page.type('input[placeholder="OAK-4B-RES"]', 'STAFF-01');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL after staff registration:', page.url());
    if (!page.url().includes('/maintenance')) {
      throw new Error(`Expected /maintenance after staff signup, got ${page.url()}`);
    }
    console.log('✓ Staff account created and routed to /maintenance');

    // 6. Sign out and log back in as Staff
    console.log('6. Logging out and logging back in as staff...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[placeholder="alex.rivera@oakridge.com"]', 'elena.rostova@facilitycare.com');
    await page.type('input[placeholder="••••••••••••"]', 'StaffSecret2026!');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1500));
    console.log('Current URL after staff login:', page.url());
    if (!page.url().includes('/maintenance')) {
      throw new Error(`Expected /maintenance after staff login, got ${page.url()}`);
    }
    const staffName = await page.evaluate(() => document.querySelector('h2')?.textContent);
    console.log('Loaded staff profile name:', staffName);
    if (!staffName?.includes('Elena Rostova')) {
      throw new Error(`Expected staff name "Elena Rostova", got "${staffName}"`);
    }
    console.log('✓ Successfully logged in with newly registered staff account!');

    console.log('🎉 PERSISTENT REGISTRATION & LOGIN VERIFICATION COMPLETE AND 100% WORKING!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testPersistedLogin();
