# Manifeste de compétences — general-purpose

**Profil agent** : [`../general-purpose.md`](../general-purpose.md)  
**Orchestrateur** : [ChefsUrsUle](../../../../.skills/ChefsUrsUle/SKILL.md)  
**Manifeste global** : [skills_manifest.md](../../../../.skills/ChefsUrsUle/references/skills_manifest.md)

## Rôle

Agent généraliste pour tâches multi-étapes. Analyse, découpe, exécute ou redélègue aux 5 autres sous-agents. Accès élargi aux skills transverses (planification, qualité, handoff).

## Skills assignés

### Priorité 1 — Coordination & clarté

| Skill | Chemin | Usage |
|-------|--------|-------|
| **requirements-clarity** | `skills-main/skills-partenaire/requirements-clarity/` | Clarifier specs ambiguës avant implémentation |
| **gepetto** | `skills-main/skills-partenaire/gepetto/` | Plans d'implémentation sectionnés |
| **session-handoff** | `skills-main/skills-partenaire/session-handoff/` | Passation entre sessions |
| **memoire-favor** | `.skills/memoire-favor/` | Contexte projet, fourtour/, wiki/ |

### Priorité 2 — Qualité & validation

| Skill | Chemin | Usage |
|-------|--------|-------|
| **webapp-testing** | `skills-main/skills-partenaire/webapp-testing/` | Tests, non-régression |
| **qa-test-planner** | `skills-main/skills-partenaire/qa-test-planner/` | Plan de tests |
| **commit-work** | `skills-main/skills-partenaire/commit-work/` | Commits git structurés |
| **skill-judge** | `skills-main/skills-partenaire/skill-judge/` | Audit qualité (si skill touché) |

### Priorité 3 — Produit & technique transversal

| Skill | Chemin | Usage |
|-------|--------|-------|
| **game-changing-features** | `skills-main/skills-partenaire/game-changing-features/` | Opportunités produit |
| **lesson-learned** | `skills-main/skills-partenaire/lesson-learned/` | Leçons depuis git |
| **ship-learn-next** | `skills-main/skills-partenaire/ship-learn-next/` | Plans depuis contenus d'apprentissage |
| **naming-analyzer** | `skills-main/skills-partenaire/naming-analyzer/` | Nommage code |
| **dependency-updater** | `skills-main/skills-partenaire/dependency-updater/` | Mise à jour dépendances |
| **reducing-entropy** | `skills-main/skills-partenaire/reducing-entropy/` | Réduction complexité (sur demande) |
| **backend-to-frontend-handoff-docs** | `skills-main/skills-partenaire/backend-to-frontend-handoff-docs/` | Doc API → front |
| **frontend-to-backend-requirements** | `skills-main/skills-partenaire/frontend-to-backend-requirements/` | Besoins front → back |

### Priorité 4 — Base de données (si tâche DB)

| Skill | Chemin | Usage |
|-------|--------|-------|
| **supabase** | `.agents/skills/supabase/` | DB, Auth, RLS |
| **supabase-postgres-best-practices** | `.agents/skills/supabase-postgres-best-practices/` | Perf SQL |

## Sous-agents — délégation (accord ChefsUrsUle)

Voir [delegation_matrix.md](delegation_matrix.md). Peut proposer délégation vers **tous** les spécialistes.

| Agent cible | Quand proposer |
|-------------|----------------|
| mermaid-diagram-specialist | Diagrammes, architecture visuelle |
| ui-ux-designer | Critique design, charte UrsUle |
| codebase-pattern-finder | Patterns existants dans le repo |
| ascii-ui-mockup-generator | Maquettes ASCII avant UI |
| communication-excellence-coach | Emails, présentations, ton |

## Protocole délégation

1. Émettre `[DEMANDE DÉLÉGATION → ChefsUrsUle]` (template dans delegation_matrix.md).
2. **Attendre** `[DÉLÉGATION APPROUVÉE]` avant de lancer l'autre agent.
3. Intégrer le `[LIVRABLE DÉLÉGATION]` reçu ; ne pas déléguer en chaîne sans nouvel accord.

## Protocole exécution

1. Lire le brief ChefsUrsUle (Cartographie d'Impact + fichiers cibles).
2. Charger les skills Priorité 1 si specs floues.
3. Exécuter ou proposer délégation (voir ci-dessus) ; valider avec webapp-testing si code livré.
4. Documenter via memoire-favor si décision majeure.

## Spécifications UrsUle

Consulter [`docs_index.md`](../../../../.skills/ChefsUrsUle/references/docs_index.md) — en particulier `prompt/PRD.md`, `prompt/TDD.md`, `prompt/ROADMAP.md`.
