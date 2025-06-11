#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');

// Test scenarios that typically crash apps
const crashTests = [
  {
    name: 'Rapid token updates',
    test: async (page) => {
      // Simulate updating token multiple times quickly
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          localStorage.setItem('metaAccessToken', 'test_token_' + Date.now());
          window.location.reload();
        });
        await page.waitForTimeout(500);
      }
      return true;
    }
  },
  {
    name: 'Invalid API responses',
    test: async (page) => {
      // Intercept API calls and return errors
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('/api/meta')) {
          request.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Simulated server error' })
          });
        } else {
          request.continue();
        }
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check if page is still responsive
      const title = await page.title();
      return title.length > 0;
    }
  },
  {
    name: 'Memory stress test',
    test: async (page) => {
      // Create large data in browser
      await page.evaluate(() => {
        const bigData = [];
        for (let i = 0; i < 1000; i++) {
          bigData.push({
            id: i,
            data: new Array(1000).fill('x').join(''),
            nested: { more: 'data' }
          });
        }
        window.testData = bigData;
      });
      
      // Check if page is still responsive
      const result = await page.evaluate(() => window.testData.length);
      return result === 1000;
    }
  },
  {
    name: 'Concurrent API calls',
    test: async (page) => {
      // Make many API calls at once
      await page.evaluate(() => {
        const promises = [];
        for (let i = 0; i < 20; i++) {
          promises.push(
            fetch('/api/meta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ test: i })
            })
          );
        }
        return Promise.allSettled(promises);
      });
      
      await page.waitForTimeout(2000);
      return true;
    }
  },
  {
    name: 'Browser back/forward stress',
    test: async (page) => {
      // Navigate back and forward rapidly
      for (let i = 0; i < 5; i++) {
        await page.goBack();
        await page.waitForTimeout(200);
        await page.goForward();
        await page.waitForTimeout(200);
      }
      
      // Check if page is still responsive
      const url = await page.url();
      return url.includes('localhost');
    }
  }
];

async function runCrashTests() {
  console.log(chalk.blue('\n🔨 Running Crash Tests...\n'));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let passed = 0;
  let failed = 0;
  
  try {
    for (const test of crashTests) {
      console.log(chalk.yellow(`Running: ${test.name}`));
      
      const page = await browser.newPage();
      
      // Set up console logging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(chalk.red(`  Browser error: ${msg.text()}`));
        }
      });
      
      // Catch page crashes
      page.on('error', err => {
        console.log(chalk.red(`  Page crashed: ${err.message}`));
      });
      
      try {
        await page.goto('http://localhost:3000', { 
          waitUntil: 'networkidle0',
          timeout: 10000 
        });
        
        const result = await test.test(page);
        
        if (result) {
          console.log(chalk.green(`  ✅ ${test.name}: PASSED`));
          passed++;
        } else {
          console.log(chalk.red(`  ❌ ${test.name}: FAILED`));
          failed++;
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ ${test.name}: CRASHED - ${error.message}`));
        failed++;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  
  console.log(chalk.blue('\n📊 Crash Test Results:\n'));
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  console.log(chalk.blue(`Total: ${crashTests.length}`));
  
  if (failed > 0) {
    console.log(chalk.red('\n❌ Your app is not crash-proof!'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ Your app survived all crash tests!'));
    process.exit(0);
  }
}

// Check if server is running
const http = require('http');
http.get('http://localhost:3000', (res) => {
  runCrashTests();
}).on('error', (err) => {
  console.log(chalk.red('❌ Server not running on localhost:3000'));
  console.log(chalk.yellow('Start your server first: npm run dev'));
  process.exit(1);
});