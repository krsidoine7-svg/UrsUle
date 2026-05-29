# VDOS — Veille et Documentation Opérationnelle de Sécurité

**Date de création :** 2026-05-29  
**Dernière mise à jour majeure :** 2026-05-29  
**Fréquence de contrôle :** Hebdomadaire (Chaque Mardi) ou toutes les 5 semaines.

Ce document est le registre central d'UrsUle pour la veille en cybersécurité, les audits de vulnérabilités, et l'alignement sur les normes RGPD (CNIL) et OWASP.

---

## 🏛️ 1. Références Institutionnelles & Portails de Veille

### 🛡️ Organismes de Confiance & Avis
* **ANSSI / CERT-FR** : [cert.ssi.gouv.fr](https://www.cert.ssi.gouv.fr/) — Alertes, avis de sécurité, et bulletins d'actualité cyber en France.
* **CNIL (RGPD)** : [cnil.fr](https://www.cnil.fr/fr/developpeurs) — Guide RGPD du développeur, conformité et fiches pratiques sur la vie privée.
* **OWASP Top 10** : [owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/) — Référence des failles applicatives web les plus critiques.
* **NIST NVD** : [nvd.nist.gov](https://nvd.nist.gov/) — National Vulnerability Database, la base mondiale de recherche de CVE.

### 📦 Sécurité de la Stack Technique UrsUle
* **Supabase Security Advisories** : [github.com/supabase/supabase/security/advisories](https://github.com/supabase/supabase/security/advisories)
* **Vue.js Advisories** : [github.com/vuejs/core/security/advisories](https://github.com/vuejs/core/security/advisories)
* **Vite Security** : [github.com/vitejs/vite/security/advisories](https://github.com/vitejs/vite/security/advisories)

---

## 📅 2. Journal des Audits et Contrôles Périodiques

Ce tableau répertorie l'historique de tous les audits de sécurité exécutés sur le projet.

| Date d'Audit | Type d'Audit (Routine/Feature/Sprint) | Auditeur (Agent/Expert) | Résultat Global (Conforme / Vulnérabilités détectées) | Actions Entreprises |
| :--- | :--- | :--- | :--- | :--- |
| **2026-05-29** | Initialisation & Audit de démarrage | `veille-securite` | ✅ Conforme | Déploiement initial. Détection d'une faille modérée dans `vite`, résolue et patchée immédiatement par la mise à niveau vers `vite@6.4.2`. |

---

## 🚨 3. Registre des Vulnérabilités & CVE Détectées

| Date de Détection | Identifiant CVE | Composant Impacté | Score CVSS / Sévérité | Statut (Ouvert/En cours/Patché) | Description & Plan de Remédiation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2026-05-29** | `GHSA-4w7w-66w2-5vf9` | `vite` | `5.5 (Moderate)` | `Patché` | Faille de Path Traversal dans la gestion des fichiers `.map` des dépendances optimisées. **Remédiation :** Corrigé par la mise à niveau vers `vite@6.4.2` et `@vitejs/plugin-vue@5.2.1`. Audit de contrôle propre. |



---

## 🇪🇺 4. Grille de Conformité RGPD pour UrsUle

| Principe RGPD | Statut | Détails de l'Implémentation dans UrsUle |
| :--- | :--- | :--- |
| **Minimisation des données** | ✅ Conforme | Seules les données directement nécessaires aux tâches, projets et humeurs sont stockées. Pas de tracking intrusif. |
| **Sécurité des données** | ✅ Conforme | Authentification via Supabase Auth. RLS activée sur toutes les tables de la base de données PostgreSQL. |
| **Transparence et Consentement** | ⚠️ En cours | Intégrer une modale d'information lors de la première connexion pour expliquer l'usage des statistiques locales. |
| **Droit à l'effacement (Oubli)** | ✅ Conforme | Suppression de compte possible depuis le profil de l'utilisateur avec cascades SQL pour nettoyer ses données. |
| **Soft-Delete & Rétention** | ✅ Conforme | Utilisation de `deleted_at` pour les entités clés permettant une récupération temporaire (corbeille) avant purge définitive. |

---

## 🛠️ 5. Plan d'Action Permanent de Durcissement (Hardening)
1. **Élimination systématique des alertes `npm audit`** au début de chaque sprint.
2. **Revue semestrielle des politiques RLS** pour valider qu'aucune faille de fuite de données n'est apparue.
3. **Desinfection HTML stricte** sur toutes les chaînes issues de l'éditeur riche Tiptap avant affichage.
