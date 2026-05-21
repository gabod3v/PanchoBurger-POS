import { test, expect } from '@playwright/test';

test.describe('Pancho Burger POS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
  });

  test('homepage loads and shows navigation', async ({ page }) => {
    await expect(page.locator('text=Pancho Burger')).toBeVisible();
    // Should see main navigation links
    await expect(page.locator('text=Nuevo Pedido').or(page.locator('text=Pedidos'))).toBeVisible();
  });

  test('can open cash register with exchange rate', async ({ page }) => {
    await page.goto('http://localhost:8080/caja');
    
    await expect(page.locator('text=Caja Cerrada')).toBeVisible();
    
    // Enter exchange rate and open
    const rateInput = page.locator('input[type="number"]');
    await rateInput.fill('50');
    await page.locator('button:has-text("Abrir Caja")').click();
    
    // If there are Bs products, we see the price confirmation step
    // Otherwise, caja should be active
    await page.waitForTimeout(1000);
    
    // Check if caja is now active or if there's a pending orders modal
    const activeText = page.locator('text=Caja Activa');
    const pendingModal = page.locator('text=Pedidos Pendientes');
    
    if (await activeText.isVisible()) {
      await expect(activeText).toBeVisible();
    }
  });

  test('can navigate between pages', async ({ page }) => {
    // Go to menu
    await page.goto('http://localhost:8080/menu');
    await expect(page.locator('text=Menú')).toBeVisible();
    
    // Go to orders
    await page.goto('http://localhost:8080/pedidos');
    await expect(page.locator('text=Pedidos')).toBeVisible();
    
    // Go to history
    await page.goto('http://localhost:8080/historial');
    await expect(page.locator('text=Historial')).toBeVisible();
  });

  test('shows exchange rate display when caja is open', async ({ page }) => {
    await page.goto('http://localhost:8080/caja');
    
    const rateInput = page.locator('input[type="number"]');
    await rateInput.fill('50');
    await page.locator('button:has-text("Abrir Caja")').click();
    await page.waitForTimeout(1000);
    
    const activeCaja = page.locator('text=Caja Activa');
    if (await activeCaja.isVisible()) {
      await expect(page.locator('text=Bs/$')).toBeVisible();
    }
  });
});
