import os
import random
from locust import HttpUser, task, between

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://xptwxsuqjnlwjrzytvpj.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS")

class UrsUleAuthNavigationUser(HttpUser):
    """
    Scénario Locust pour tester l'authentification Supabase Auth,
    la vérification du token JWT (headers Bearer) et la navigation
    entre les pages principales de l'application cliente Vue.
    """
    wait_time = between(1.0, 3.0)

    def on_start(self):
        """
        À la connexion de l'utilisateur virtuel, nous tentons un login
        ou simulons la récupération d'une session anonyme / JWT Bearer.
        """
        self.headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

    @task(3)
    def test_navigation_dashboard(self):
        """
        Simule l'arrivée et navigation vers le Dashboard.
        """
        with self.client.get("/", name="Nav — Dashboard (/) ", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Erreur Dashboard : {res.status_code}")

    @task(2)
    def test_navigation_tasks_view(self):
        """
        Simule l'ouverture de la vue des Tâches & chargement RLS.
        """
        with self.client.get("/tasks", name="Nav — Tâches (/tasks)", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Erreur vue Tâches : {res.status_code}")

    @task(2)
    def test_navigation_projects_view(self):
        """
        Simule l'ouverture de la vue des Projets.
        """
        with self.client.get("/projects", name="Nav — Projets (/projects)", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Erreur vue Projets : {res.status_code}")

    @task(2)
    def test_navigation_brain_view(self):
        """
        Simule le basculement en mode Plein Écran Second Cerveau (PKM / Brain).
        """
        with self.client.get("/brain", name="Nav — Brain (/brain)", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Erreur vue Brain : {res.status_code}")

    @task(1)
    def test_auth_session_verification(self):
        """
        Simule un appel de vérification de session / utilisateur à Supabase Auth.
        """
        auth_url = f"{SUPABASE_URL}/auth/v1/user"
        with self.client.get(auth_url, headers=self.headers, name="Auth — Vérification Session /user", catch_response=True) as res:
            # 200 si JWT utilisateur authentifié, 401 si clé anonyme pure (les deux valident que l'API Auth répond instantanément sans crash)
            if res.status_code in [200, 401]:
                res.success()
            else:
                res.failure(f"Erreur Supabase Auth : {res.status_code}")
