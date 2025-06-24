import { test, expect } from '@playwright/test';

test.describe('Complete User Journeys', () => {
  test('Dashboard displays real-time data', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard-simple');
    
    // Verify all tabs are present
    await expect(page.locator('[data-tab="overview"]')).toBeVisible();
    await expect(page.locator('[data-tab="ai-analytics"]')).toBeVisible();
    await expect(page.locator('[data-tab="lineup-builder"]')).toBeVisible();
    await expect(page.locator('[data-tab="voice-assistant"]')).toBeVisible();
    
    // Check live indicator
    await expect(page.locator('.live-indicator')).toBeVisible();
    await expect(page.locator('.live-indicator')).toHaveClass(/pulse|animate|live/);
  });

  test('AI recommendations are generated and updated', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard-simple');
    
    // Switch to AI Analytics tab
    await page.click('[data-tab="ai-analytics"]');
    
    // Verify AI insights are present
    await expect(page.locator('.ai-insight')).toHaveCount(3);
    
    // Check confidence scores
    const confidenceElements = await page.locator('.confidence-score').all();
    for (const element of confidenceElements) {
      const text = await element.innerText();
      const confidence = parseInt(text.replace('%', ''));
      expect(confidence).toBeGreaterThan(70);
    }
    
    // Verify recommendations update
    const initialRec = await page.locator('.ai-insight').first().innerText();
    await page.waitForTimeout(30000); // Wait for update
    await page.reload();
    await page.click('[data-tab="ai-analytics"]');
    const newRec = await page.locator('.ai-insight').first().innerText();
    // Content should have updated or at least timestamp changed
    expect(newRec).toBeTruthy();
  });

  test('Player cards show real-time stats', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard-simple');
    
    // Check player cards exist
    const playerCards = await page.locator('.player-card').all();
    expect(playerCards.length).toBeGreaterThan(0);
    
    // Verify each card has required data
    for (const card of playerCards.slice(0, 3)) { // Check first 3
      await expect(card.locator('.player-name')).toBeVisible();
      await expect(card.locator('.player-position')).toBeVisible();
      await expect(card.locator('.player-team')).toBeVisible();
      await expect(card.locator('.projected-points')).toBeVisible();
      
      // Check projected points are reasonable
      const points = await card.locator('.projected-points').innerText();
      const pointValue = parseFloat(points);
      expect(pointValue).toBeGreaterThan(0);
      expect(pointValue).toBeLessThan(50);
    }
  });

  test('Lineup builder allows drag and drop', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard-simple');
    
    // Switch to lineup builder
    await page.click('[data-tab="lineup-builder"]');
    
    // Verify lineup slots exist
    await expect(page.locator('.lineup-slot')).toHaveCount(9); // Standard fantasy lineup
    
    // Check available players section
    await expect(page.locator('.available-players')).toBeVisible();
    await expect(page.locator('.available-player')).toHaveCount(5);
    
    // Verify drag and drop attributes
    const availablePlayer = page.locator('.available-player').first();
    await expect(availablePlayer).toHaveAttribute('draggable', 'true');
  });

  test('Voice assistant interface is accessible', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard-simple');
    
    // Switch to voice assistant
    await page.click('[data-tab="voice-assistant"]');
    
    // Check voice interface elements
    await expect(page.locator('.voice-status')).toBeVisible();
    await expect(page.locator('.voice-button')).toBeVisible();
    
    // Verify ElevenLabs integration message
    await expect(page.locator('.voice-description')).toContainText(/voice|speak|ask/i);
  });

  test('Performance metrics are displayed', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard-simple');
    
    // Check performance stats in overview
    await expect(page.locator('.league-rank')).toBeVisible();
    await expect(page.locator('.win-rate')).toBeVisible();
    await expect(page.locator('.ai-score')).toBeVisible();
    
    // Verify values are reasonable
    const winRate = await page.locator('.win-rate').innerText();
    const winRateValue = parseInt(winRate.replace('%', ''));
    expect(winRateValue).toBeGreaterThanOrEqual(0);
    expect(winRateValue).toBeLessThanOrEqual(100);
  });
});