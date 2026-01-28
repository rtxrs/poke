const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PLAYER_ID = 'cc4caddad5da1579d7790fed15aaee339db3d22e850f59079a96200a0ff661bf';

test.describe('Private Dashboard Visual Tests', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Ensure user data is registered in the system before testing
    const dataPath = path.join(__dirname, '..', 'pgsharp_player_data', `${PLAYER_ID}.json`);
    const playerData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Register data via /api/save-data
    const regResponse = await request.post('/api/save-data', {
      data: playerData
    });
    
    if (regResponse.status() !== 200) {
      console.error(`Registration failed with status ${regResponse.status()}: ${await regResponse.text()}`);
    }

    // Perform login with Player ID
    await page.goto('/login.html');
    await page.fill('input[name="playerId"]', PLAYER_ID);
    
    // Listen for the login response
    const loginPromise = page.waitForResponse(response => response.url().includes('/login') && response.request().method() === 'POST');
    await page.click('#form-playerId button[type="submit"]');
    
    const loginResponse = await loginPromise;
    if (loginResponse.status() !== 200) {
      const errorText = await page.locator('#playerId-error').textContent();
      console.error(`Login failed with status ${loginResponse.status()}. Page error: ${errorText}`);
    }
    
    // Wait for redirect to /me
    await page.waitForURL('**/me', { timeout: 10000 });
    // Wait for Vue app to load
    await page.waitForSelector('.loading-overlay', { state: 'hidden', timeout: 30000 });
  });

  test('Dashboard Tabs and Tools Layout', async ({ page }) => {
    // 1. Character Tab (Default)
    await expect(page.locator('#character-section')).toBeVisible();
    await expect(page).toHaveScreenshot('private-character-tab.png', { fullPage: true });

    // 2. Pokemon Tab
    await page.click('#subheader-placeholder .subheader-nav li:has-text("Pokémon")');
    await expect(page.locator('#pokemon-section')).toBeVisible();
    // Wait for grid to render
    await page.waitForSelector('.pokemon-grid', { timeout: 10000 });
    await expect(page).toHaveScreenshot('private-pokemon-tab.png', { fullPage: true });

    // 3. Pokedex Tab
    await page.click('#subheader-placeholder .subheader-nav li:has-text("Pokédex")');
    await expect(page.locator('#pokedex-section')).toBeVisible();
    await expect(page).toHaveScreenshot('private-pokedex-tab.png', { fullPage: true });

    // 4. Statistics Tab
    await page.click('#subheader-placeholder .subheader-nav li:has-text("Statistics")');
    await expect(page.locator('#statistics-section')).toBeVisible();
    // Statistics have charts/animations, wait a bit
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('private-statistics-tab.png', { fullPage: true });

    // 5. Tools Tab & Modals
    await page.click('#subheader-placeholder .subheader-nav li:has-text("Tools")');
    await expect(page.locator('#tools-section')).toBeVisible();
    
    // Open Cleanup Modal
    await page.click('button:has-text("Pokemon Cleanup")');
    await expect(page.locator('#cleanup-modal-backdrop')).toBeVisible();
    await expect(page.locator('#cleanup-modal-content')).toHaveScreenshot('tool-cleanup-modal.png');
    await page.click('#cleanup-modal-close-btn');

    // Open Trash String Modal
    await page.click('button:has-text("Trash String Generator")');
    await expect(page.locator('#trash-modal-backdrop')).toBeVisible();
    await expect(page.locator('#trash-modal-content')).toHaveScreenshot('tool-trash-modal.png');
    await page.click('#trash-modal-close-btn');

    // Open Team Builder Modal
    await page.click('button:has-text("Raid Team Builder")');
    await expect(page.locator('#team-builder-modal-backdrop')).toBeVisible();
    await expect(page.locator('#team-builder-modal-content')).toHaveScreenshot('tool-teambuilder-modal.png');
  });

  test('Responsiveness - Mobile View', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check Character Tab on mobile
    await expect(page.locator('#character-section')).toBeVisible();
    // Look for any overlapping or overflow
    await expect(page).toHaveScreenshot('private-mobile-character.png', { fullPage: true });

    // Open Tools and check Cleanup Modal on mobile
    await page.click('#subheader-placeholder .subheader-nav li:has-text("Tools")');
    await page.click('button:has-text("Pokemon Cleanup")');
    await expect(page.locator('#cleanup-modal-content')).toHaveScreenshot('private-mobile-cleanup-modal.png');
  });
});
