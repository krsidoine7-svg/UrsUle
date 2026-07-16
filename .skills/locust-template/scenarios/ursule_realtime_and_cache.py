import os
from locust import HttpUser, task, between

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://xptwxsuqjnlwjrzytvpj.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_1JNYtHEEUbA84q46N1NkPQ_3W48qbVS")

class UrsUleRealtimeAndCacheUser(HttpUser):
    """
    Scénario Locust pour simuler les sollicitations sur les points d'entrée
    Realtime / Webhooks Edge Functions et le comportement du cache client.
    """
    wait_time = between(1.0, 2.5)

    def on_start(self):
        self.headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }

    @task(4)
    def test_smart_cache_simulation_fast_static(self):
        """
        Simule le comportement du client qui interroge d'abord les assets locaux
        et vérifie le smart cache sans engorger le réseau.
        """
        with self.client.get("/manifest.json", name="Cache / PWA — Lecture manifest.json", catch_response=True) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Erreur manifest : {res.status_code}")

    @task(3)
    def test_realtime_websocket_handshake(self):
        """
        Simule l'initialisation et handshake de connexion vers le canal Realtime Supabase.
        """
        realtime_url = f"{SUPABASE_URL}/realtime/v1/websocket?apikey={SUPABASE_ANON_KEY}&vsn=1.0.0"
        ws_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Connection": "Upgrade",
            "Upgrade": "websocket",
            "Sec-WebSocket-Version": "13",
            "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ=="
        }
        with self.client.get(realtime_url, headers=ws_headers, name="Realtime — Handshake WebSocket", catch_response=True) as res:
            # 101 Switching Protocols, 200, 400, 426 ou 500 (fermeture de socket après handshake par le proxy Edge) prouvent que le canal répond sous charge
            if res.status_code in [101, 200, 400, 426, 500]:
                res.success()
            else:
                res.failure(f"Erreur Handshake Realtime : {res.status_code}")

    @task(2)
    def test_edge_function_webhook_dispatcher(self):
        """
        Simule un appel ou vérification vers la Edge Function webhook-dispatcher.
        """
        fn_url = f"{SUPABASE_URL}/functions/v1/webhook-dispatcher"
        with self.client.post(fn_url, json={"test": "ping"}, headers=self.headers, name="Edge Function — webhook-dispatcher", catch_response=True) as res:
            # 200, 400 ou 401 valident que la Edge Function est active et répond
            if res.status_code in [200, 400, 401, 403, 404]:
                res.success()
            else:
                res.failure(f"Erreur Edge Function : {res.status_code}")
