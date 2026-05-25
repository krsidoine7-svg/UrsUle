# 📋 Manifeste des Compétences & Outils (Skills Manifest)

Ce manifeste liste de manière exhaustive toutes les compétences (skills), agents spécialisés et outils à la disposition du skill manager **`ChefsUrsUle`**. Il doit s'y référer pour déléguer les tâches ou exécuter des actions ciblées.

---

## 🗂️ 1. Compétences Système & Base de Données

### 🧠 memoire-favor
* **Localisation** : `.skills/memoire-favor/`
* **Rôle** : Gérer la mémoire externe persistante du projet Favor Company International.
* **Quand l'utiliser** :
  * En début de session, pour lire `wiki/sessions/` et recharger le contexte.
  * Au fil de l'eau, pour documenter chaque action, décision ou bug dans `fourtour/`.
  * En fin de session, pour structurer les résumés dans `wiki/sessions/` et mettre à jour `wiki/projet/roadmap.md` et `wiki/INDEX.md`.
* **Important** : Masque automatiquement les informations sensibles avec des placeholders `{{...}}`.

### 🗄️ supabase
* **Localisation** : `.agents/skills/supabase/`
* **Rôle** : Toutes les opérations liées à Supabase (Database, Auth, Storage, Edge Functions, Realtime, RLS).
* **Quand l'utiliser** :
  * Modification ou création de tables, de politiques RLS.
  * Audit de sécurité de l'accès aux données.
  * Intégrations de flux d'authentification ou gestion de sessions.

### ⚡ supabase-postgres-best-practices
* **Localisation** : `.agents/skills/supabase-postgres-best-practices/`
* **Rôle** : Optimisation des performances et bonnes pratiques PostgreSQL.
* **Quand l'utiliser** :
  * Écriture ou optimisation de requêtes SQL complexes.
  * Configuration d'index sur les tables de la base de données.
  * Audit de performance des tables `tasks`, `projects` ou `time_sessions`.

---

## 🛠️ 2. Outils de Développement & Gestion de Skills

### 📝 skill-creator
* **Localisation** : `skills-main/skills/skill-creator/`
* **Rôle** : Créer, modifier, optimiser et évaluer des skills dans le projet.
* **Quand l'utiliser** :
  * Dès que l'utilisateur souhaite formaliser une nouvelle compétence réutilisable.
  * Pour optimiser la description YAML de déclenchement d'un skill via `run_loop.py`.

---

## 🎨 3. Compétences Visuelles & Design (Tailwind, shadcn, CSS)

### 💻 frontend-design
* **Localisation** : `skills-main/skills/frontend-design/`
* **Rôle** : Conception d'interfaces utilisateur modernes, réactives, avec des designs premium.
* **Quand l'utiliser** :
  * Lors de la refonte ou de la retouche des pages (ex: `DashboardView.vue`, `TasksView.vue`).
  * Pour appliquer la charte de couleurs (Bleu `#2563EB`, Vert forêt `#16A34A`, Blanc) et des micro-animations.

### 🎨 theme-factory
* **Localisation** : `skills-main/skills/theme-factory/`
* **Rôle** : Génération et maintenance des palettes de couleurs et tokens CSS.
* **Quand l'utiliser** :
  * Modification de `tailwind.config.ts` ou de `src/assets/main.css`.
  * Intégration de variables de thème dynamiques ou support du dark mode.

### 📐 canvas-design
* **Localisation** : `skills-main/skills/canvas-design/`
* **Rôle** : Conception de structures de graphiques interactifs complexes ou de tableaux blancs.
* **Quand l'utiliser** :
  * Lors de l'amélioration ou de la refonte visuelle des graphiques de statistiques dans `StatsView.vue` (Chart.js).

---

## 📄 4. Compétences de Traitement & Génération de Documents (Exports)

### 📈 xlsx
* **Localisation** : `skills-main/skills/xlsx/`
* **Rôle** : Lecture, écriture et mise en page avancée de fichiers Excel.
* **Quand l'utiliser** :
  * Lors de l'amélioration ou de la correction du service d'export Excel dans `export.service.ts`.
  * Pour structurer et formater le fichier Excel téléchargé par l'utilisateur (ex: colonnes lisibles, en français).

### 📑 pdf
* **Localisation** : `skills-main/skills/pdf/`
* **Rôle** : Génération et mise en page professionnelle de rapports PDF.
* **Quand l'utiliser** :
  * Pour l'audit ou l'amélioration du rendu d'export PDF dans `export.service.ts` (jsPDF et html2canvas).
  * Pour garantir le respect de la charte graphique et du logo UrsUle lors de la génération de rapports de tâches.

### 📝 docx
* **Localisation** : `skills-main/skills/docx/`
* **Rôle** : Génération et manipulation de documents Microsoft Word (.docx).
* **Quand l'utiliser** :
  * Si l'utilisateur demande d'ajouter un export au format Word pour les comptes-rendus ou rapports de projets.

### 📊 pptx
* **Localisation** : `skills-main/skills/pptx/`
* **Rôle** : Génération de présentations PowerPoint professionnelles.
* **Quand l'utiliser** :
  * Si l'utilisateur souhaite créer un export ou un résumé visuel sous forme de diapositives pour présenter sa productivité.

---

## 🧪 5. Compétences de Test, Rédaction & Communication

### 🧪 webapp-testing
* **Localisation** : `skills-main/skills/webapp-testing/`
* **Rôle** : Validation, tests unitaires, tests E2E et couverture de code d'applications web.
* **Quand l'utiliser** :
  * Avant de clore une feature ou un sprint, pour s'assurer de l'absence de régressions.
  * Pour écrire des scripts de validation robustes.

### ✍️ doc-coauthoring
* **Localisation** : `skills-main/skills/doc-coauthoring/`
* **Rôle** : Rédaction, relecture et amélioration de documents de spécifications ou de manuels.
* **Quand l'utiliser** :
  * Pour peaufiner les PRD, TDD ou rédiger la documentation finale d'UrsUle.

### 📞 internal-comms
* **Localisation** : `skills-main/skills/internal-comms/`
* **Rôle** : Rédaction de messages, annonces, ou emails professionnels.
* **Quand l'utiliser** :
  * Pour rédiger des rapports d'activité à envoyer aux partenaires de Krsidoine ou formuler des résumés exécutifs.

---

## ⚙️ 6. Compétences Additionnelles

* **`algorithmic-art`** : Pour la conception de patterns ou visuels génératifs complexes.
* **`brand-guidelines`** : Pour l'alignement sur les règles de marque strictes.
* **`claude-api`** : Pour interagir directement avec l'API de Claude de manière optimisée.
* **`mcp-builder`** : Pour construire ou étendre des serveurs MCP personnalisés pour le projet.
* **`slack-gif-creator`** : Pour la création de médias/Gifs de statut d'avancement.
* **`web-artifacts-builder`** : Pour générer des démonstrations et maquettes web réutilisables sous forme d'artefacts HTML indépendants.

---

## 🎯 Protocole de Sélection et de Délégation
En tant que **Chef de Projet**, le skill `ChefsUrsUle` doit :
1. Découper la requête de l'utilisateur en sous-tâches spécifiques.
2. Pour chaque sous-tâche, identifier le skill le plus pertinent dans ce manifeste.
3. Formuler les instructions destinées au sous-agent en faisant référence aux dossiers de spécifications (`prompt/`) et aux guidelines du skill sélectionné.
