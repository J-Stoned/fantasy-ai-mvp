import { test, expect } from '@playwright/test';

test.describe('ML Performance Tracking', () => {
  test('ML accuracy is above 70%', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/ml-dashboard');
    
    // Check current accuracy
    const accuracy = await page.locator('.accuracy-percentage').innerText();
    expect(parseFloat(accuracy)).toBeGreaterThan(70);
  });

  test('ML accuracy is improving over time', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/ml-dashboard');
    
    // Get initial accuracy
    const initialAccuracy = await page.locator('.accuracy-percentage').innerText();
    
    // Wait for a learning cycle (30 seconds)
    await page.waitForTimeout(30000);
    await page.reload();
    
    // Check new accuracy
    const newAccuracy = await page.locator('.accuracy-percentage').innerText();
    expect(parseFloat(newAccuracy)).toBeGreaterThanOrEqual(parseFloat(initialAccuracy));
  });

  test('All 4 GPU models are training', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/ml-models');
    
    // Verify 4 models exist
    await expect(page.locator('.model-status')).toHaveCount(4);
    
    // Check all are training
    await expect(page.locator('.model-status.training')).toHaveCount(4);
    
    // Verify model names
    await expect(page.locator('.model-name')).toContainText(['UltraPredictor-GPU']);
    await expect(page.locator('.model-name')).toContainText(['DeepFantasy-GPU']);
    await expect(page.locator('.model-name')).toContainText(['NeuralOptimizer-GPU']);
    await expect(page.locator('.model-name')).toContainText(['QuantumPredict-GPU']);
  });

  test('Predictions are being generated', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/predictions');
    
    // Check predictions per second
    const predictionsPerSec = await page.locator('.predictions-per-second').innerText();
    expect(parseInt(predictionsPerSec.replace(/,/g, ''))).toBeGreaterThan(1000);
    
    // Verify confidence scores
    const confidenceScores = await page.locator('.confidence-score').all();
    for (const score of confidenceScores) {
      const value = await score.innerText();
      expect(parseFloat(value)).toBeGreaterThan(0.5);
    }
  });

  test('Model performance metrics are tracked', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/ml-metrics');
    
    // Check loss is decreasing
    const currentLoss = await page.locator('.current-loss').innerText();
    expect(parseFloat(currentLoss)).toBeLessThan(0.5);
    
    // Verify training epochs
    const epochs = await page.locator('.training-epochs').innerText();
    expect(parseInt(epochs)).toBeGreaterThan(0);
    
    // Check learning rate
    await expect(page.locator('.learning-rate')).toBeVisible();
  });
});