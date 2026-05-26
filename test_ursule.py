from playwright.sync_api import sync_playwright
import os

def run_test():
    print("🚀 Démarrage du test automatisé UrsUle...")
    
    with sync_playwright() as p:
        # Lancement du navigateur Chrome en mode headless (sans interface visible)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Connexion à l'application locale
        url = "http://localhost:5173"
        print(f"🔗 Navigation vers {url}...")
        page.goto(url)
        
        # Attente que tout le JavaScript et le réseau soient chargés
        page.wait_for_load_state("networkidle")
        
        # 1. Vérification du chargement
        print("🔍 Analyse de la page d'accueil...")
        title = page.title()
        print(f"📝 Titre de la page détecté : '{title}'")
        
        # 2. Capture d'écran de vérification visuelle
        screenshot_path = "ursule_test_screenshot.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"📸 Capture d'écran enregistrée avec succès sous : '{os.path.abspath(screenshot_path)}'")
        
        # 3. Vérification des éléments d'authentification
        # Vérifie si on est sur la page de connexion (ce qui est normal au départ si non connecté)
        if page.locator("input[type='email']").is_visible():
            print("🔑 Écran de connexion Supabase Auth détecté (Champs Email et Mot de passe présents).")
        else:
            print("ℹ️ Écran de connexion non détecté ou utilisateur déjà authentifié.")
            
        print("✅ Test terminé avec succès !")
        browser.close()

if __name__ == "__main__":
    run_test()
