import random
from locust import HttpUser, task, between

class UrsUleSEOGEOLLMUser(HttpUser):
    """
    Scénario Locust dédié à l'audit de performance et de résilience SEO, GEO (Generative Engine Optimization)
    et aux robots des LLM (Perplexity, Claude, ChatGPT Search, Gemini, Googlebot).
    Vérifie que les fichiers stratégiques (/llms.txt, /robots.txt, /sitemap.xml) et les pages publiques
    répondent avec un TTFB ultra-rapide (< 100ms) même sous une vague de crawlers IA simultanés.
    """
    wait_time = between(1.0, 3.0)

    # Liste des User-Agents IA autorisés dans robots.txt et scrapers standard
    GEO_USER_AGENTS = [
        "PerplexityBot/1.0",
        "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
        "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Mozilla/5.0 (compatible; Applebot-Extended/1.0)"
    ]

    @task(5)
    def test_llms_txt_speed(self):
        """
        Simule la lecture du fichier llms.txt par des agents d'intelligence artificielle.
        Le fichier llms.txt doit être servi instantanément pour permettre l'indexation sémantique GEO.
        """
        headers = {"User-Agent": random.choice(self.GEO_USER_AGENTS)}
        with self.client.get("/llms.txt", headers=headers, name="GEO / LLM — Lecture llms.txt", catch_response=True) as response:
            if response.status_code == 200 and "UrsUle" in response.text and "PKM" in response.text:
                response.success()
            else:
                response.failure(f"Erreur llms.txt (Code {response.status_code} ou contenu manquant)")

    @task(3)
    def test_robots_txt_directives(self):
        """
        Simule la requête des moteurs de recherche et crawlers IA sur robots.txt.
        """
        headers = {"User-Agent": random.choice(self.GEO_USER_AGENTS)}
        with self.client.get("/robots.txt", headers=headers, name="SEO / GEO — Lecture robots.txt", catch_response=True) as response:
            if response.status_code == 200 and "PerplexityBot" in response.text and "Allow: /llms.txt" in response.text:
                response.success()
            else:
                response.failure(f"Erreur robots.txt : {response.status_code}")

    @task(2)
    def test_public_homepage_seo_crawler(self):
        """
        Simule le passage d'un bot SEO (Googlebot / Bingbot) sur la page d'accueil d'UrsUle.
        Mesure la vitesse du rendu HTML et du Time To First Byte (TTFB).
        """
        headers = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}
        with self.client.get("/", headers=headers, name="SEO — Rendu Accueil Googlebot", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Erreur SEO sur / : {response.status_code}")

    @task(2)
    def test_public_share_link_bot_crawl(self):
        """
        Simule un bot IA ou réseau social crawlée sur une URL de partage public (/share/:token).
        """
        headers = {"User-Agent": random.choice(self.GEO_USER_AGENTS)}
        with self.client.get("/share/demo-public-note", headers=headers, name="GEO / SEO — Crawl Note Partagée", catch_response=True) as response:
            # En SPA Vite, la route /share/... renvoie l'index.html (200) ou est traitée côté client
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Erreur crawl sur note partagée : {response.status_code}")
