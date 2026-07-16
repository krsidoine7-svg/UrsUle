from locust import LoadTestShape
from scenarios.ursule_pkm_test import UrsUlePKMLocustUser
from scenarios.ursule_seo_geo_llm import UrsUleSEOGEOLLMUser
from scenarios.ursule_auth_navigation import UrsUleAuthNavigationUser
from scenarios.ursule_pkm_intensive import UrsUlePKMIntensiveUser
from scenarios.ursule_realtime_and_cache import UrsUleRealtimeAndCacheUser

class UrsUleStairwayStressShape(LoadTestShape):
    """
    Contrôleur de palier d'endurance et de stress en escalier (LoadTestShape).
    Orchestre automatiquement la montée en charge mixte (les 5 profils d'utilisateurs en parallèle)
    selon les paliers officiels définis par ChefsUrsUle :
    - Palier 1 : 10 à 50 utilisateurs (Échauffement & Nominale)
    - Palier 2 : 200 utilisateurs (Pic quotidien)
    - Palier 3 : 500 à 1 000 utilisateurs (Surcharge & Endurance maximale)
    """
    stages = [
        {"duration": 30, "users": 10, "spawn_rate": 2},    # Palier 1A : 10 users (Warmup - 30s)
        {"duration": 60, "users": 50, "spawn_rate": 5},    # Palier 1B : 50 users (Nominale - 60s)
        {"duration": 120, "users": 200, "spawn_rate": 15}, # Palier 2  : 200 users (Pic - 120s)
        {"duration": 180, "users": 500, "spawn_rate": 25}, # Palier 3A : 500 users (Stress - 180s)
        {"duration": 240, "users": 1000, "spawn_rate": 40} # Palier 3B : 1000 users (Endurance max - 240s)
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return (stage["users"], stage["spawn_rate"])
        return None
