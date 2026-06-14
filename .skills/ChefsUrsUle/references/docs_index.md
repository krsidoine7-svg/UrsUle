# 🧠 Indexation & Catalogue des Spécifications (Docs Index)

Ce catalogue répertorie et résume tous les documents stratégiques de spécification de l'application **UrsUle** stockés dans le dossier [`prompt/`](../../../prompt/). Le skill manager **`ChefsUrsUle`** doit impérativement se référer à ces index pour guider le développement de chaque module et s'assurer du respect des règles métiers.

> **Chemins** : relatifs à la racine du dépôt (workspace). Ne jamais figer un chemin absolu machine (`C:\Users\...`, `file:///...`).

---

## 📋 1. Documents Fondateurs & Métier

### 📄 [PRD.md (Product Requirement Document)](../../../prompt/PRD.md)
* **Objet** : Définition de la vision du produit, des personas cibles, des KPIs de succès, et des spécifications détaillées de toutes les fonctionnalités (F-01 à F-18).
* **Règles Clés** :
  * **F-01** : Authentification et profil utilisateur dans la Timezone `Africa/Abidjan` (GMT+0).
  * **F-03** : CRUD des tâches avec slide-over panel, édition inline et corbeille.
  * **F-08** : Validation gamifiée (défis de calcul mental pour passer une tâche en "Terminé").
  * **F-09** : Suivi post-tâche d'appréciation / humeur (emoji modal de 2 secondes max).
  * **F-10** : Gestion de projets complexes avec progression calculée en temps réel.
  * **F-11** : Statistiques avancées avec graphiques interactifs (Chart.js).

### 📄 [ROADMAP.md (Planning & Phases)](../../../prompt/ROADMAP.md)
* **Objet** : Calendrier de développement découpé en phases et sprints, de la Phase 0 (Setup) à la Phase 19 (Polish).
* **Règles Clés** :
  * Définition précise du critère de "Done" pour chaque sprint et feature.
  * Historique de la répartition des priorités (P0, P1, P2, P3).
  * Intégration de webhooks vers Make.com pour l'automatisation des alertes en fin de roadmap.

---

## 💻 2. Architecture & Design Technique

### 📄 [TDD.md (Technical Design Document)](../../../prompt/TDD.md)
* **Objet** : Spécifications techniques complètes, structure des répertoires du projet, typage des données et modélisation de la base de données.
* **Règles Clés** :
  * Utilisation exclusive de Vue 3 (Composition API), Vite, TypeScript, Pinia, Vue Router et Tailwind CSS v3.
  * Structuration propre de l'API de services dans `src/services/` et du state management dans `src/stores/`.
  * Intégration des composants UI basés sur `shadcn-vue` et `radix-vue`.

### 📄 [DESIGN_SYSTEM.md (Charte Graphique)](../../../prompt/DESIGN_SYSTEM.md)
* **Objet** : Spécification des tokens visuels, configuration Tailwind exacte, palette de couleurs (Bleu `#2563EB`, Vert forêt `#16A34A`, Blanc), typographies (Sora pour les titres, Inter pour le corps).
* **Règles Clés** :
  * Contient la configuration complète à injecter dans `tailwind.config.ts`.
  * Normes pour la création de composants réutilisables à design hautement esthétique et premium.

---

## 🔒 3. Sécurité & APIs

### 📄 [SECURITY.md (Politiques de Sécurité)](../../../prompt/SECURITY.md)
* **Objet** : Directives de sécurité du système, règles d'accès RLS (Row Level Security) sur Supabase, chiffrement des données et protection contre l'exfiltration de données sensibles.
* **Règles Clés** :
  * RLS activé sur chaque table exposée. Les utilisateurs ne doivent pouvoir modifier ou lire que leurs propres données.
  * Ne jamais exposer de clé `service_role` ou de secrets en clair côté client.
  * Utilisation exclusive de requêtes paramétrées pour éviter l'injection SQL.

### 📄 [API_URSULE.md (Documentation API)](../../../prompt/API_URSULE.md)
* **Objet** : Spécification complète des routes REST, des requêtes Supabase, et des payloads attendus pour chaque table.
* **Règles Clés** :
  * Schémas des requêtes d'insertion et de mise à jour pour `tasks`, `projects`, `task_comments` et `time_sessions`.

### 📄 [MCP_URSULE.md (Custom MCP)](../../../prompt/MCP_URSULE.md)
* **Objet** : Actions et extensions du Model Context Protocol pour connecter l'application à des services tiers de manière standardisée.

---

## 🚀 4. Évolutions & Spécifications Futures (V2)

### 📄 [MVP_V1.md (Guide d'Implémentation)](../../../prompt/MVP_V1.md)
* **Objet** : Recueil de tous les prompts de codage étape par étape ayant servi à bâtir l'intégralité du MVP V1. Permet de comprendre comment chaque composant a été structuré et d'effectuer des tests de non-régression.

### 📄 [PKM_BRAIN.md (UrsUle Brain - V2)](../../../prompt/PKM_BRAIN.md)
* **Objet** : Spécifications complètes du futur module de Gestion Personnelle des Connaissances (**Personal Knowledge Management**) inspiré d'Obsidian et de Logseq.
* **Règles Clés** :
  * Conçu comme un nouvel onglet dans la sidebar de l'application UrsUle.
  * Permettra la création de notes interconnectées avec graphe relationnel interactif.
  * Proposera des flashcards quotidiennes basées sur la répétition espacée.
  * Liaison dynamique entre les notes de connaissances, les tâches et les projets existants du MVP V1.
