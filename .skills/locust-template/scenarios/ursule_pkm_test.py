import os
from locust import HttpUser, task, between

# Configuration des variables d'environnement Supabase et locales
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://xptwxsuqjnlwjrzytvpj.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS")

class UrsUlePKMLocustUser(HttpUser):
    """
    Scénario Locust dédié à UrsUle (PKM & Partage de notes BRAIN-F10).
    Simule une charge mixte d'utilisateurs publics (invités via liens partagés)
    et de requêtes vers l'API REST/RPC Supabase.
    """
    # Pause entre 0.5 et 2 secondes entre les actions de chaque utilisateur virtuel
    wait_time = between(0.5, 2.0)

    @task(4)
    def test_local_app_homepage(self):
        """
        Simule le chargement de l'application cliente locale Vite/Vue.
        """
        with self.client.get("/", name="1. App Client Local (GET /)", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Code HTTP inattendu sur l'accueil : {response.status_code}")

    @task(3)
    def test_shared_note_rpc(self):
        """
        Simule l'accès d'un visiteur à une note partagée via le RPC SECURITY DEFINER
        get_shared_note_by_token (BRAIN-F10).
        """
        rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/get_shared_note_by_token"
        headers = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        payload = {"token_or_slug": "test-benchmark-slug-404"}

        with self.client.post(rpc_url, json=payload, headers=headers, name="2. Supabase RPC (get_shared_note_by_token)", catch_response=True) as response:
            if response.status_code in [200, 400, 404]:
                response.success()
            else:
                response.failure(f"Erreur RPC get_shared_note_by_token : {response.status_code}")

    @task(2)
    def test_tasks_rls_and_indexes(self):
        """
        Simule la récupération des tâches par un utilisateur (teste les index de performance 023).
        """
        tasks_url = f"{SUPABASE_URL}/rest/v1/tasks?select=id,title,status,priority&limit=20"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

        with self.client.get(tasks_url, headers=headers, name="3. Supabase REST (Table Tasks)", catch_response=True) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Erreur REST Tasks : {response.status_code}")

    @task(2)
    def test_notes_search_index(self):
        """
        Simule la recherche et liste de notes (teste l'index GIN full-text de BRAIN-F09).
        """
        notes_url = f"{SUPABASE_URL}/rest/v1/notes?select=id,title,updated_at&limit=10"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

        with self.client.get(notes_url, headers=headers, name="4. Supabase REST (Table Notes)", catch_response=True) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Erreur REST Notes : {response.status_code}")
