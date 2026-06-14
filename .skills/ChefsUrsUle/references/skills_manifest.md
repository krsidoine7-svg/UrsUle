# 📋 Manifeste des Compétences & Outils (Skills Manifest)

Ce manifeste liste toutes les compétences (skills), agents spécialisés et outils à la disposition du skill manager **`ChefsUrsUle`**. Il doit s'y référer pour déléguer les tâches ou exécuter des actions ciblées.

**Index catalogue** : [`skills-main/INDEX.md`](../../../skills-main/INDEX.md)

> **Chemins** : toujours relatifs à la racine du dépôt (workspace) ou au fichier courant. Ne jamais figer un chemin absolu machine (`C:\Users\...`, `file:///...`).

---

## 🗺️ Carte globale des emplacements

| Zone | Chemin | Rôle |
|------|--------|------|
| **Orchestrateur** | `.skills/ChefsUrsUle/` | Manager central, délégation, mémoire |
| **Skills UrsUle natifs** | `.skills/skill-mermaidH/`, `.skills/memoire-favor/`, `.skills/veille-securite/` | Compétences propriétaires du projet |
| **Skills partenaires** | `skills-main/skills-partenaire/` | Catalogue Anthropic + Softaworks/agent-toolkit + MCP |
| **Sous-agents** | `skills-main/agents/` | Profils de délégation (Task tool) |
| **Commandes** | `skills-main/commands/` | Maintenance du catalogue skills |
| **Supabase** | `.agents/skills/supabase/`, `.agents/skills/supabase-postgres-best-practices/` | Base de données & performance |

> **Règle** : toujours préférer un skill UrsUle natif avant un homologue dans `skills-partenaire/`.

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

### 🛡️ veille-securite
* **Localisation** : `.skills/veille-securite/`
* **Rôle** : Expert en cybersécurité, RGPD et veille technologique. Maintient le fichier `VDOS.md`.
* **Quand l'utiliser** :
  * Lors d'une session de veille hebdomadaire (Mardi) ou mensuelle.
  * Pour auditer les CVE sur `npm audit`, OWASP, ANSSI, CNIL.
  * Pour valider la conformité RGPD d'une nouvelle fonctionnalité.

---

## 📐 2. Diagrammes & Architecture (Mermaid)

### ⭐ skill-mermaidH — **Skill principal UrsUle**
* **Localisation** : `.skills/skill-mermaidH/`
* **Rôle** : Skill ultime Mermaid — conception, validation, stylisation et export (flowchart, séquence, ERD, C4, états, Gantt, 20+ types). Fusionne agent-toolkit, mermaid-skill, Pretty-mermaid, claude-mermaid et C4.
* **Quand l'utiliser** :
  * Toute demande de diagramme, schéma, architecture, flux, modélisation, ERD, séquence, C4.
  * Documentation technique dans `prompt/` (TDD, PKM_BRAIN, architecture).
  * Export SVG/ASCII via `scripts/render.mjs`.
* **Invocation** : `@skill-mermaidH` ou mention explicite de diagramme Mermaid.
* **Références** : `references/INDEX.md`, `references/workflow.md`, `ARCHITECTURE.md`.

### 🔌 claude-mermaid-mcp (partenaire — preview live)
* **Localisation** : `skills-main/skills-partenaire/claude-mermaid-mcp/`
* **Rôle** : Itération diagramme avec rechargement live via MCP (`mermaid_preview`, `mermaid_save`).
* **Quand l'utiliser** : Uniquement si les outils MCP Mermaid sont disponibles et que l'utilisateur veut un preview navigateur interactif. Sinon → `skill-mermaidH`.

### 📊 mermaid-diagrams (partenaire — syntaxe)
* **Localisation** : `skills-main/skills-partenaire/mermaid-diagrams/`
* **Rôle** : Guide syntaxe agent-toolkit (class, sequence, flowchart, ERD, C4).
* **Quand l'utiliser** : Référence syntaxique complémentaire ; contenu déjà fusionné dans `skill-mermaidH/references/core/`.

### 🏗️ c4-architecture (partenaire)
* **Localisation** : `skills-main/skills-partenaire/c4-architecture/`
* **Rôle** : Documentation architecture modèle C4 (Context, Container, Component, Code).
* **Quand l'utiliser** : Diagrammes C4 approfondis ; contenu fusionné dans `skill-mermaidH/references/c4/`.

---

## 🛠️ 3. Outils de Développement & Gestion de Skills

### 📝 skill-creator
* **Localisation** : `skills-main/skills-partenaire/skill-creator/`
* **Rôle** : Créer, modifier, optimiser et évaluer des skills dans le projet.
* **Quand l'utiliser** :
  * Dès que l'utilisateur souhaite formaliser une nouvelle compétence réutilisable.
  * Pour optimiser la description YAML de déclenchement d'un skill via `run_loop.py`.
  * **Obligatoire** avant intégration d'un nouveau skill (standard 5 étoiles ChefsUrsUle).

### ⚖️ skill-judge
* **Localisation** : `skills-main/skills-partenaire/skill-judge/`
* **Rôle** : Auditer la qualité d'un SKILL.md (spec Agent Skills, bonnes pratiques).
* **Quand l'utiliser** : Revue avant merge d'un skill partenaire ou natif.

### 🔧 plugin-forge
* **Localisation** : `skills-main/skills-partenaire/plugin-forge/`
* **Rôle** : Créer et gérer des plugins Claude Code (manifests, marketplace).

### 📋 command-creator
* **Localisation** : `skills-main/skills-partenaire/command-creator/`
* **Rôle** : Créer des commandes slash Claude Code.

### 🔄 agent-md-refactor
* **Localisation** : `skills-main/skills-partenaire/agent-md-refactor/`
* **Rôle** : Refactoriser AGENTS.md et fichiers de configuration agent.

### 📉 reducing-entropy
* **Localisation** : `skills-main/skills-partenaire/reducing-entropy/`
* **Rôle** : Réduire la taille et la complexité du codebase (sur demande explicite).

### 🏷️ naming-analyzer
* **Localisation** : `skills-main/skills-partenaire/naming-analyzer/`
* **Rôle** : Suggérer de meilleurs noms de variables, fonctions et classes.

### 📦 dependency-updater
* **Localisation** : `skills-main/skills-partenaire/dependency-updater/`
* **Rôle** : Mettre à jour les dépendances npm/pnpm de façon structurée.

---

## 🎨 4. Compétences Visuelles & Design

### 💻 frontend-design
* **Localisation** : `skills-main/skills-partenaire/frontend-design/`
* **Rôle** : Conception d'interfaces modernes, réactives, designs premium.
* **Quand l'utiliser** : Refonte pages Vue (`DashboardView`, `TasksView`), charte UrsUle (Bleu `#2563EB`, Vert `#16A34A`).

### 🎨 theme-factory
* **Localisation** : `skills-main/skills-partenaire/theme-factory/`
* **Rôle** : Palettes de couleurs et tokens CSS.
* **Quand l'utiliser** : `tailwind.config.ts`, dark mode, variables de thème.

### 📐 canvas-design
* **Localisation** : `skills-main/skills-partenaire/canvas-design/`
* **Rôle** : Graphiques interactifs complexes, tableaux blancs.
* **Quand l'utiliser** : Refonte visuelle `StatsView.vue` (Chart.js).

### 🧩 design-system-starter
* **Localisation** : `skills-main/skills-partenaire/design-system-starter/`
* **Rôle** : Amorcer un design system (tokens, composants).

### 🎯 mui
* **Localisation** : `skills-main/skills-partenaire/mui/`
* **Rôle** : Patterns Material-UI v7 (sx, thème, responsive).

### ✏️ excalidraw / draw-io
* **Localisation** : `skills-main/skills-partenaire/excalidraw/`, `skills-main/skills-partenaire/draw-io/`
* **Rôle** : Diagrammes hand-drawn (Excalidraw) ou draw.io (AWS icons, PNG).

### 🏷️ brand-guidelines
* **Localisation** : `skills-main/skills-partenaire/brand-guidelines/`
* **Rôle** : Alignement strict sur les règles de marque UrsUle.

### 🎭 algorithmic-art
* **Localisation** : `skills-main/skills-partenaire/algorithmic-art/`
* **Rôle** : Visuels génératifs et patterns algorithmiques.

---

## 📄 5. Documents & Exports

| Skill | Localisation | Usage UrsUle |
|-------|--------------|--------------|
| **xlsx** | `skills-partenaire/xlsx/` | Export Excel `export.service.ts` |
| **pdf** | `skills-partenaire/pdf/` | Export PDF jsPDF / html2canvas |
| **docx** | `skills-partenaire/docx/` | Rapports Word |
| **pptx** | `skills-partenaire/pptx/` | Présentations productivité |
| **marp-slide** | `skills-partenaire/marp-slide/` | Slides Markdown → PDF/HTML |
| **web-to-markdown** | `skills-partenaire/web-to-markdown/` | Conversion pages web → Markdown |

*(Préfixe complet : `skills-main/skills-partenaire/`)*

---

## 🧪 6. Tests, Qualité & Rédaction

### 🧪 webapp-testing
* **Localisation** : `skills-main/skills-partenaire/webapp-testing/`
* **Rôle** : Tests unitaires, E2E, couverture applications web.
* **Quand l'utiliser** : Avant clôture feature/sprint, absence de régressions.

### 🔍 qa-test-planner
* **Localisation** : `skills-main/skills-partenaire/qa-test-planner/`
* **Rôle** : Planification de campagnes de test, templates bug report.

### ✍️ doc-coauthoring
* **Localisation** : `skills-main/skills-partenaire/doc-coauthoring/`
* **Rôle** : Co-rédaction PRD, TDD, documentation finale UrsUle.

### 📞 internal-comms / professional-communication
* **Localisation** : `skills-partenaire/internal-comms/`, `skills-partenaire/professional-communication/`
* **Rôle** : Messages internes, emails, rapports exécutifs partenaires Krsidoine.

### ✒️ writing-clearly-and-concisely / humanizer
* **Localisation** : `skills-partenaire/writing-clearly-and-concisely/`, `skills-partenaire/humanizer/`
* **Rôle** : Prose claire, documentation, messages UI sans style « IA générique ».

### 📖 crafting-effective-readmes
* **Localisation** : `skills-main/skills-partenaire/crafting-effective-readmes/`
* **Rôle** : README structurés selon le type de projet.

### 💬 feedback-mastery / difficult-workplace-conversations
* **Localisation** : `skills-partenaire/feedback-mastery/`, `skills-partenaire/difficult-workplace-conversations/`
* **Rôle** : Feedback structuré, conversations difficiles (modèle SBI).

---

## ⚙️ 7. Développement Technique & Intégrations

| Skill | Localisation | Quand l'utiliser |
|-------|--------------|------------------|
| **react-dev** | `skills-partenaire/react-dev/` | Composants React/TS, hooks, events |
| **react-useeffect** | `skills-partenaire/react-useeffect/` | Revue useEffect, anti-patterns |
| **database-schema-designer** | `skills-partenaire/database-schema-designer/` | Conception schéma SQL/Supabase |
| **openapi-to-typescript** | `skills-partenaire/openapi-to-typescript/` | OpenAPI → interfaces TypeScript |
| **mcp-builder** | `skills-partenaire/mcp-builder/` | Serveurs MCP personnalisés |
| **claude-api** | `skills-partenaire/claude-api/` | Intégration API Claude optimisée |
| **codex** | `skills-partenaire/codex/` | Codex CLI (OpenAI) |
| **gemini** | `skills-partenaire/gemini/` | Gemini CLI, gros contexte |
| **perplexity** | `skills-partenaire/perplexity/` | Recherche web / veille |
| **jira** | `skills-partenaire/jira/` | Tickets Jira (PROJ-123) |
| **datadog-cli** | `skills-partenaire/datadog-cli/` | Logs, métriques, traces Datadog |
| **web-artifacts-builder** | `skills-partenaire/web-artifacts-builder/` | Maquettes HTML autonomes |

---

## 🤝 8. Productivité, Handoff & Stratégie Produit

| Skill | Localisation | Quand l'utiliser |
|-------|--------------|------------------|
| **gepetto** | `skills-partenaire/gepetto/` | Plans d'implémentation sectionnés, multi-LLM |
| **session-handoff** | `skills-partenaire/session-handoff/` | Documents de passation entre sessions agent |
| **commit-work** | `skills-partenaire/commit-work/` | Commits git de qualité, commits logiques |
| **requirements-clarity** | `skills-partenaire/requirements-clarity/` | Clarifier specs ambiguës avant implémentation |
| **backend-to-frontend-handoff-docs** | `skills-partenaire/backend-to-frontend-handoff-docs/` | Doc API pour le front |
| **frontend-to-backend-requirements** | `skills-partenaire/frontend-to-backend-requirements/` | Besoins data front → back |
| **lesson-learned** | `skills-partenaire/lesson-learned/` | Leçons depuis l'historique git |
| **ship-learn-next** | `skills-partenaire/ship-learn-next/` | Plans d'action depuis contenus d'apprentissage |
| **game-changing-features** | `skills-partenaire/game-changing-features/` | Opportunités produit 10x |
| **daily-meeting-update** | `skills-partenaire/daily-meeting-update/` | Comptes-rendus stand-up |
| **domain-name-brainstormer** | `skills-partenaire/domain-name-brainstormer/` | Idées noms de domaine |
| **meme-factory** | `skills-partenaire/meme-factory/` | Mèmes (communication légère) |
| **slack-gif-creator** | `skills-partenaire/slack-gif-creator/` | GIFs statut d'avancement |

*(Préfixe complet : `skills-main/skills-partenaire/`)*

---

## 🤖 9. Sous-agents (skills-main/agents/)

Profils pour délégation via sous-agent ou Task tool. Brief structuré obligatoire (voir ChefsUrsUle §3).

**Index manifestes agents** : [`skills-main/agents/manifests/INDEX.md`](../../../skills-main/agents/manifests/INDEX.md)

Chaque sous-agent possède un **manifeste de compétences** listant les skills autorisés + lien vers le [manifeste global ChefsUrsUle](skills_manifest.md) (ce fichier).

| Agent | Profil | Manifeste compétences | Skills |
|-------|--------|----------------------|--------|
| **general-purpose** | `agents/general-purpose.md` | [`manifests/general-purpose_manifest.md`](../../../skills-main/agents/manifests/general-purpose_manifest.md) | 18 |
| **mermaid-diagram-specialist** | `agents/mermaid-diagram-specialist.md` | [`manifests/mermaid-diagram-specialist_manifest.md`](../../../skills-main/agents/manifests/mermaid-diagram-specialist_manifest.md) | 9 |
| **ui-ux-designer** | `agents/ui-ux-designer.md` | [`manifests/ui-ux-designer_manifest.md`](../../../skills-main/agents/manifests/ui-ux-designer_manifest.md) | 10 |
| **codebase-pattern-finder** | `agents/codebase-pattern-finder.md` | [`manifests/codebase-pattern-finder_manifest.md`](../../../skills-main/agents/manifests/codebase-pattern-finder_manifest.md) | 11 |
| **ascii-ui-mockup-generator** | `agents/ascii-ui-mockup-generator.md` | [`manifests/ascii-ui-mockup-generator_manifest.md`](../../../skills-main/agents/manifests/ascii-ui-mockup-generator_manifest.md) | 7 |
| **communication-excellence-coach** | `agents/communication-excellence-coach.md` | [`manifests/communication-excellence-coach_manifest.md`](../../../skills-main/agents/manifests/communication-excellence-coach_manifest.md) | 12 |

**Chemin racine agents** : `skills-main/agents/`

### Délégation inter-agents (accord ChefsUrsUle)

Les sous-agents peuvent **proposer** de déléguer une **partie** de leur travail à un spécialiste plus adapté — **uniquement après accord de ChefsUrsUle**.

→ **[Matrice & protocole](../../../skills-main/agents/manifests/delegation_matrix.md)**

### Brief de délégation sous-agent (ChefsUrsUle)

Inclure dans chaque brief :

```markdown
- **Manifeste agent** : skills-main/agents/manifests/{agent}_manifest.md
- **Manifeste global** : .skills/ChefsUrsUle/references/skills_manifest.md
- **Skills à charger** : (liste depuis le manifeste agent, Priorité 1 en premier)
- **Délégation inter-agents** : [oui/non — matrice delegation_matrix.md]
```

---

## ⌨️ 10. Commandes (skills-main/commands/)

| Commande | Fichier | Rôle |
|----------|---------|------|
| **sync-skills-readme** | `commands/sync-skills-readme.md` | Synchroniser le README avec l'inventaire skills-partenaire |

**Conventions skills** : `skills-main/AGENTS.md`

---

## 🎯 Protocole de Sélection et de Délégation

En tant que **Chef de Projet**, le skill `ChefsUrsUle` doit :

1. **Découper** la requête en sous-tâches spécifiques.
2. **Consulter ce manifeste** et [`skills-main/INDEX.md`](../../../skills-main/INDEX.md).
3. **Prioriser** les skills UrsUle natifs (`.skills/`) avant les partenaires.
4. **Diagrammes** : toujours `skill-mermaidH` en premier ; MCP ou partenaire seulement si besoin explicite.
5. **Nouveau skill** : `skill-creator` → audit `skill-judge` → validation utilisateur → mise à jour de ce manifeste.
6. **Formuler le brief** sous-agent avec : Cartographie d'Impact, skill à charger, spec `prompt/`, fichiers cibles, critères de validation.
