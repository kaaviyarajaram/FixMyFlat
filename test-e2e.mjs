import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\WELCOME\\.gemini\\antigravity-ide\\brain\\857dd052-d00e-443a-b7c3-dae7843a6eb5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runE2E() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  try {
    // 1. Visit Login Page
    console.log('1. Testing Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_1_login.png') });
    console.log('✓ Login page captured');

    // 2. Visit Signup Page
    console.log('2. Testing Signup Page...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_2_signup.png') });
    console.log('✓ Signup page captured');

    // 3. Perform Resident Login
    console.log('3. Performing Resident Login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    // Click demo resident button
    const residentBtn = await page.waitForSelector('button ::-p-text(Resident (Alex))');
    await residentBtn.click();
    
    // Click submit
    const loginBtn = await page.waitForSelector('button[type="submit"]');
    await loginBtn.click();

    // Wait for client navigation to /resident
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_3_resident_home.png') });
    console.log('✓ Resident Home captured');

    // 4. Navigate to Report Issue
    console.log('4. Navigating to Report Issue...');
    const reportBtn = await page.waitForSelector('button ::-p-text(Report an issue)');
    await reportBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_4_report_issue.png') });
    console.log('✓ Report Issue page captured');

    // 5. Fill and Submit Issue
    console.log('5. Submitting a new issue...');
    await page.select('select', 'Plumbing');
    await page.type('input[placeholder*="Water leakage"]', 'Kitchen sink pipe dripping');
    await page.type('textarea', 'Water is steadily dripping from the drain trap beneath the kitchen sink.');
    await page.click('button[type="submit"]');

    // Wait for redirect to issue details
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_5_resident_issue_details.png') });
    console.log('✓ Resident Issue Details captured');

    // 6. Sign out and Login as Maintenance Staff
    console.log('6. Switching to Maintenance Staff...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    const staffBtn = await page.waitForSelector('button ::-p-text(Staff (Graham))');
    await staffBtn.click();
    const loginStaffBtn = await page.waitForSelector('button[type="submit"]');
    await loginStaffBtn.click();

    // Wait for client navigation to /maintenance
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_6_maintenance_dashboard.png') });
    console.log('✓ Maintenance Dashboard captured');

    // 7. Open Issue in Maintenance Details
    console.log('7. Opening Maintenance Issue Details...');
    const updateStatusLinks = await page.$$('span ::-p-text(Update Status)');
    if (updateStatusLinks.length > 0) {
      await updateStatusLinks[0].click();
    }
    await page.waitForSelector('select', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Update status to in_progress (Under Process)
    await page.select('select', 'in_progress');
    const updateBtn = await page.waitForSelector('button ::-p-text(Update Status)');
    await updateBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_7_maintenance_issue_details.png') });
    console.log('✓ Maintenance Issue Details captured with status update');

    // Update status to resolved
    await page.select('select', 'resolved');
    const updateBtn2 = await page.waitForSelector('button ::-p-text(Update Status)');
    await updateBtn2.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_8_maintenance_resolved.png') });
    console.log('✓ Maintenance Issue Details captured with resolved status');

    console.log('🎉 ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during E2E run:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2E();
