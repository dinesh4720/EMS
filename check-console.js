// check-console.js
const puppeteer = require('puppeteer');

async function checkConsoleErrors(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto(url);
  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for page to load

  await browser.close();

  if (errors.length > 0) {
    console.log(JSON.stringify({ errors }, null, 2));
    process.exit(1);
  } else {
    console.log('No errors detected');
    process.exit(0);
  }
}

checkConsoleErrors(process.argv[2] || 'http://localhost:3000');
