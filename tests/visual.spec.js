const { test, expect } = require('@playwright/test');

test.describe('Public Dashboard Visual Tests', () => {
  test('Home page should look correct on all devices', async ({ page }) => {
    await page.goto('/');
    
    // Wait for loading overlay to be hidden (which means data is loaded)
    await page.waitForSelector('#loading-overlay', { state: 'hidden', timeout: 15000 });
    
    // Take a screenshot of the full page
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      mask: [page.locator('.loading-spinner')]
    });
  });

  test('Player Modal should display correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#loading-overlay', { state: 'hidden' });

    // Click the first player row
    const firstPlayerRow = page.locator('#recent-players-body tr.clickable-row').first();
    await firstPlayerRow.click();

    // Wait for modal to be visible
    const modal = page.locator('#modal-backdrop');
    await expect(modal).not.toHaveClass(/hidden/);
    
    // Wait for player detail content to load inside the modal
    await page.waitForSelector('#modal-content .grid-stats', { timeout: 10000 });

    // Take screenshot of the modal
    await expect(page.locator('#modal-content')).toHaveScreenshot('player-modal.png');
  });

  test('Pokemon Modal should display correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#loading-overlay', { state: 'hidden' });

    // Click the first strongest pokemon row
    const firstPokemonRow = page.locator('#strongest-pokemon-body tr.clickable-pokemon-row').first();
    await firstPokemonRow.click();

    // Wait for modal to be visible
    const modal = page.locator('#modal-backdrop');
    await expect(modal).not.toHaveClass(/hidden/);
    
    // Wait for IV stats animation
    await page.waitForTimeout(600); 

    // Take screenshot of the pokemon modal
    await expect(page.locator('#modal-content')).toHaveScreenshot('pokemon-modal.png');
  });

  test('Rarity Modal should display correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#loading-overlay', { state: 'hidden' });

    // Click the first rarest pokemon row
    const firstRarityRow = page.locator('#rarest-pokemon-body tr.clickable-rarity-row').first();
    await firstRarityRow.click();

    // Wait for modal to be visible
    const modal = page.locator('#modal-backdrop');
    await expect(modal).not.toHaveClass(/hidden/);

    // Take screenshot of the rarity modal
    await expect(page.locator('#modal-content')).toHaveScreenshot('rarity-modal.png');
  });
});
