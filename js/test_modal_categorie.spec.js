const { test, expect } = require('@playwright/test');

test.describe('Category Modal', () => {
  test('should open, fill, save, and close the category modal', async ({ page }) => {
    // Mock the API call to ensure a successful response
    await page.route('**/api/categories.php', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Category saved successfully' }),
      });
    });

    // Navigate to the application
    await page.goto('http://localhost:8000');

    // 1. Click the main "Achats" sidebar item
    await page.locator('[onclick="showSection(\'achats\')"]').click();

    // 2. Click the "Catégories" tab within the "Achats" section
    await page.locator('button[onclick="showAchatsTab(\'categories\')"]').click();

    // 3. Wait for the open modal button to appear and click it
    const openModalButton = page.locator('#achats-categories-content').getByText('Nouvelle Catégorie');
    await expect(openModalButton).toBeVisible();
    await openModalButton.click();

    // Wait for the modal to be visible
    const modal = page.locator('#categorieModal');
    await expect(modal).toBeVisible();

    // Fill the form
    await page.locator('#categorie-code').fill('TEST');
    await page.locator('#categorie-nom').fill('Test Category');
    await page.locator('#categorie-description').fill('This is a test category.');

    // Click the save button
    await page.locator('button[onclick="submitCategoryForm()"]').click();

    // Assert that the modal is hidden after saving
    await expect(modal).toBeHidden();

    // Take a screenshot to verify the final state
    await page.screenshot({ path: 'test-results/category-modal-test.png' });
  });
});
