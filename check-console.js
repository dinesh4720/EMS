// check-console.js
const puppeteer = require('puppeteer');

async function checkConsoleErrors(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'console',
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', error => {
    errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack
    });
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Wait for page to fully load using a promise
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    errors.push({
      type: 'navigation',
      message: `Failed to load page: ${error.message}`
    });
  }

  await browser.close();

  if (errors.length > 0) {
    console.log('Console errors detected:\n');
    errors.forEach((err, index) => {
      console.log(`Error ${index + 1}:`);
      console.log(`  Type: ${err.type}`);
      if (err.text) console.log(`  Text: ${err.text}`);
      if (err.message) console.log(`  Message: ${err.message}`);
      if (err.stack) console.log(`  Stack: ${err.stack}`);
      if (err.location) console.log(`  Location: ${err.location.url}:${err.location.lineNumber}:${err.location.columnNumber}`);
      console.log('');
    });
    process.exit(1);
  } else {
    console.log('✅ No errors detected');
    process.exit(0);
  }
}

checkConsoleErrors(process.argv[2] || 'http://localhost:5173');
