const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
  });

  page.on('requestfailed', request => {
    console.error(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  
  console.log('Typing credentials...');
  await page.type('input[type="email"]', 'rcpimrd@gmail.com');
  await page.type('input[type="password"]', 'admin123');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for navigation or error...');
  await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds to see what happens
  
  await browser.close();
})();
