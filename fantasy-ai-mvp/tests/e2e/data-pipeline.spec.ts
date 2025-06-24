import { test, expect } from '@playwright/test';

test.describe('Data Collection Pipeline', () => {
  test('All APIs are actively collecting data', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/api-status');
    
    // OpenWeather API
    await expect(page.locator('.api-status.openweather')).toContainText('ACTIVE');
    const weatherCalls = await page.locator('.api-calls.openweather').innerText();
    expect(parseInt(weatherCalls)).toBeGreaterThan(0);
    
    // Odds API
    await expect(page.locator('.api-status.odds')).toContainText('ACTIVE');
    const oddsCalls = await page.locator('.api-calls.odds').innerText();
    expect(parseInt(oddsCalls)).toBeGreaterThan(0);
    
    // News API
    await expect(page.locator('.api-status.news')).toContainText('ACTIVE');
    const newsCalls = await page.locator('.api-calls.news').innerText();
    expect(parseInt(newsCalls)).toBeGreaterThan(0);
    
    // Ball Don't Lie API
    await expect(page.locator('.api-status.balldontlie')).toContainText('ACTIVE');
    const nbaCallsJ = await page.locator('.api-calls.balldontlie').innerText();
    expect(parseInt(nbaCallsJ)).toBeGreaterThan(0);
  });

  test('Player data is updating in real-time', async ({ page }) => {
    // Check a specific player
    await page.goto('http://localhost:3001/players/patrick-mahomes');
    
    // Verify player loaded
    await expect(page.locator('.player-name')).toContainText('Patrick Mahomes');
    
    // Check last updated time
    const lastUpdated = await page.locator('.last-updated').innerText();
    expect(lastUpdated).toMatch(/\d+ seconds ago|\d+ minutes ago/);
    
    // Verify stats are present
    await expect(page.locator('.player-stats')).toBeVisible();
    await expect(page.locator('.player-projection')).toBeVisible();
  });

  test('Database is growing continuously', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/database-stats');
    
    // Track growth over 10 seconds
    const measurements = [];
    for (let i = 0; i < 3; i++) {
      const count = await page.locator('.total-records').innerText();
      measurements.push(parseInt(count.replace(/,/g, '')));
      if (i < 2) await page.waitForTimeout(5000);
    }
    
    // Verify growth
    expect(measurements[1]).toBeGreaterThan(measurements[0]);
    expect(measurements[2]).toBeGreaterThan(measurements[1]);
  });

  test('Weather data is being collected for stadiums', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/weather-data');
    
    // Check major stadiums have weather data
    const stadiums = ['Arrowhead Stadium', 'Gillette Stadium', 'MetLife Stadium'];
    
    for (const stadium of stadiums) {
      const weatherElement = await page.locator(`[data-stadium="${stadium}"]`);
      await expect(weatherElement).toBeVisible();
      await expect(weatherElement.locator('.temperature')).toBeVisible();
      await expect(weatherElement.locator('.conditions')).toBeVisible();
    }
  });

  test('News and sentiment analysis is working', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/news-sentiment');
    
    // Check news articles are being collected
    const articleCount = await page.locator('.article-count').innerText();
    expect(parseInt(articleCount)).toBeGreaterThan(0);
    
    // Verify sentiment scores
    const sentimentScores = await page.locator('.sentiment-score').all();
    expect(sentimentScores.length).toBeGreaterThan(0);
    
    // Check trending topics
    await expect(page.locator('.trending-topics')).toBeVisible();
  });
});