
import re
from playwright.sync_api import Page, expect, sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:8000/index.php")

    # Attendre que le spinner de chargement disparaisse
    # C'est l'indicateur le plus fiable que les données sont (ou devraient être) chargées
    loading_spinner = page.locator('#total-balance .loading')
    expect(loading_spinner).to_be_hidden(timeout=20000) # Augmentation du timeout

    # Vérifier qu'un élément clé du tableau de bord est visible et contient des données
    total_balance_element = page.locator('#total-balance')

    # S'assurer que l'élément est visible
    expect(total_balance_element).to_be_visible(timeout=5000)

    # S'assurer que l'élément n'est pas vide
    # Il devrait contenir une devise comme "€" ou "DZD"
    expect(total_balance_element).not_to_be_empty()

    print("Test de chargement du tableau de bord réussi : Le spinner a disparu et le solde total est affiché.")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
