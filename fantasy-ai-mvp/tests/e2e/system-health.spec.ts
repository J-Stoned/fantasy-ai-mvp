import { test, expect } from '@playwright/test';

test.describe('System Health Monitoring', () => {
  test('GPU acceleration is active', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/gpu-status');
    
    // Check GPU is active
    await expect(page.locator('.gpu-status')).toContainText('ACTIVE');
    
    // Verify GPU utilization is high
    const utilization = await page.locator('.gpu-utilization').innerText();
    expect(parseInt(utilization)).toBeGreaterThan(70);
    
    // Check TFLOPS
    await expect(page.locator('.tflops')).toContainText('15.7');
  });

  test('500 workers are processing', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/workers');
    
    // Verify all workers active
    await expect(page.locator('.active-workers')).toContainText('500');
    
    // Check processing rate
    const tasksPerHour = await page.locator('.tasks-per-hour').innerText();
    expect(parseInt(tasksPerHour.replace(/,/g, ''))).toBeGreaterThan(250000);
  });

  test('Database is receiving continuous updates', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/database');
    
    // Get initial record count
    const initialCount = await page.locator('.record-count').innerText();
    
    // Wait 5 seconds
    await page.waitForTimeout(5000);
    await page.reload();
    
    // Verify count increased
    const newCount = await page.locator('.record-count').innerText();
    expect(parseInt(newCount.replace(/,/g, ''))).toBeGreaterThan(parseInt(initialCount.replace(/,/g, '')));
  });

  test('All API connections are active', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/api-status');
    
    // Check each API
    await expect(page.locator('.api-status.openweather')).toContainText('ACTIVE');
    await expect(page.locator('.api-status.odds')).toContainText('ACTIVE');
    await expect(page.locator('.api-status.news')).toContainText('ACTIVE');
    await expect(page.locator('.api-status.balldontlie')).toContainText('ACTIVE');
    await expect(page.locator('.api-status.openai')).toContainText('ACTIVE');
  });

  test('System performance metrics are healthy', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/monitoring');
    
    // Check response time
    const responseTime = await page.locator('.response-time').innerText();
    expect(parseInt(responseTime)).toBeLessThan(100);
    
    // Verify no errors
    await expect(page.locator('.error-rate')).toContainText('0%');
    
    // Check memory usage
    const memoryUsage = await page.locator('.memory-usage').innerText();
    expect(parseInt(memoryUsage)).toBeLessThan(90);
  });
});