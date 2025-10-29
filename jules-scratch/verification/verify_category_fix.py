from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")
        page.get_by_role("link", name="Achats").click()
        page.get_by_role("button", name="Catégories").click()
        page.get_by_role("button", name="Nouvelle Catégorie").click()
        page.locator("#categorie-code").fill("TEST")
        page.locator("#categorie-nom").fill("Test")
        page.locator("#categorie-description").fill("Test description")
        page.get_by_role("button", name="Enregistrer").click()
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

run()
