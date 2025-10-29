from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Wait for the dashboard to be visible and for the loading indicators to disappear.
        # This confirms that the initial data has been loaded.
        page.wait_for_selector("#dashboard-section")
        page.wait_for_selector("#total-balance:not(:has(.loading))")

        page.screenshot(path="jules-scratch/verification/initial_load_verification.png")
        browser.close()

run()
