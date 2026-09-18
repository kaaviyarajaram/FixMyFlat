import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testRootRoute() {
  console.log('Testing that opening the host link lands directly on the Login page...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 420, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const finalUrl = page.url();
    console.log('Final URL after opening root host link:', finalUrl);

    if (!finalUrl.includes('/login')) {
      throw new Error(`Expected URL to be /login, but was ${finalUrl}`);
    }

    const heading = await page.evaluate(() => document.querySelector('h1')?.textContent);
    console.log('Page heading:', heading);
    if (!heading?.includes('Welcome back')) {
      throw new Error(`Expected heading "Welcome back", got "${heading}"`);
    }

    console.log('✓ Verified: Opening host link directly opens the Login page without any auto-redirection to maintenance or resident!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testRootRoute();
