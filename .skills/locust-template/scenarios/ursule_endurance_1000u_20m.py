from locust import LoadTestShape
from scenarios.ursule_pkm_test import UrsUlePKMLocustUser
from scenarios.ursule_seo_geo_llm import UrsUleSEOGEOLLMUser
from scenarios.ursule_auth_navigation import UrsUleAuthNavigationUser
from scenarios.ursule_pkm_intensive import UrsUlePKMIntensiveUser
from scenarios.ursule_realtime_and_cache import UrsUleRealtimeAndCacheUser

class UrsUleEndurance1000Users20Minutes(LoadTestShape):
    """
    Contrôleur d'Endurance Extrême (ChefsUrsUle) :
    1 000 Utilisateurs Simultamés pendant 20 minutes (1 200 secondes) non-stop.
    Sollicitation intensive de toutes les fonctionnalités de l'écosystème :
    - PKM / Second Cerveau & Recherche Full-Text GIN (Cmd+K)
    - Tâches, Projets & calcul des progressions RLS
    - Dossiers & Flashcards (Algorithme SM-2)
    - Partage public de notes (RPC SECURITY DEFINER)
    - Moteurs IA / GEO (llms.txt, robots.txt) et crawlers SEO
    - Authentification JWT & Sockets Realtime
    """
    stages = [
        {"duration": 60, "users": 200, "spawn_rate": 20},     # Échauffement rapide : 200 users (1 min)
        {"duration": 120, "users": 500, "spawn_rate": 30},    # Montée forte : 500 users (1 min)
        {"duration": 1200, "users": 1000, "spawn_rate": 50}   # Endurance Plateau : 1 000 users jusqu'à 20 minutes (18 min non-stop)
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return (stage["users"], stage["spawn_rate"])
        return None
