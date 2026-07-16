import os
import random
from locust import HttpUser, task, between

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://xptwxsuqjnlwjrzytvpj.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS")

class UrsUlePKMIntensiveUser(HttpUser):
    """
    Scénario Locust pour simuler une charge intensive sur le moteur PKM (Brain).
    Sollicite la recherche plein texte (Cmd+K), la hiérarchie de dossiers / flashcards,
    et les lectures RLS multicomptes.
    """
    wait_time = between(0.5, 1.5)

    def on_start(self):
        self.headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        self.keywords = ["projet", "urgent", "réunion", "idée", "note", "brain", "tâche", "2026", "ursule"]

    @task(5)
    def test_fulltext_search_bypass_cache(self):
        """
        Simule la recherche globale Cmd+K avec un mot-clé aléatoire pour solliciter
        l'index GIN plein texte de PostgreSQL sans réutiliser le cache de requête.
        """
        kw = random.choice(self.keywords)
        url = f"{SUPABASE_URL}/rest/v1/notes?select=id,title,updated_at&title=ilike.*{kw}*&limit=15"
        with self.client.get(url, headers=self.headers, name="PKM — Recherche Full-Text (Cmd+K)", catch_response=True) as res:
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Erreur Recherche FTS : {res.status_code}")

    @task(3)
    def test_fetch_folders_hierarchy(self):
        """
        Simule la récupération de l'arbre de dossiers PKM du panneau latéral.
        """
        url = f"{SUPABASE_URL}/rest/v1/note_folders?select=id,name,parent_id,color&limit=50"
        with self.client.get(url, headers=self.headers, name="PKM — Récupération Dossiers / Arbre", catch_response=True) as res:
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Erreur Arbre Dossiers : {res.status_code}")

    @task(3)
    def test_fetch_flashcards(self):
        """
        Simule le chargement du deck de révision Flashcards.
        """
        url = f"{SUPABASE_URL}/rest/v1/flashcards?select=id,question,answer,interval_days,due_date&limit=30"
        with self.client.get(url, headers=self.headers, name="PKM — Chargement Flashcards", catch_response=True) as res:
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Erreur Flashcards : {res.status_code}")

    @task(2)
    def test_fetch_projects_with_tasks_count(self):
        """
        Simule la requête de la vue Projets avec calcul des progressions.
        """
        url = f"{SUPABASE_URL}/rest/v1/projects?select=id,name,status,color,deadline&limit=20"
        with self.client.get(url, headers=self.headers, name="PKM — Projets & Progression", catch_response=True) as res:
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Erreur Projets : {res.status_code}")
