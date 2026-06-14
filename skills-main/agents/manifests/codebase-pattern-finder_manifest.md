# Manifeste de compétences — codebase-pattern-finder

**Profil agent** : [`../codebase-pattern-finder.md`](../codebase-pattern-finder.md)  
**Orchestrateur** : [ChefsUrsUle](../../../../.skills/ChefsUrsUle/SKILL.md)  
**Manifeste global** : [skills_manifest.md](../../../../.skills/ChefsUrsUle/references/skills_manifest.md)

## Rôle

Trouve et documente les patterns **existants** dans le repo UrsUle (Vue 3, Pinia, services Supabase). Montre le code tel quel — sans juger ni refactoriser sauf demande explicite.

## Skills assignés

| Priorité | Skill | Chemin | Usage |
|----------|-------|--------|-------|
| ⭐ 1 | **naming-analyzer** | `skills-main/skills-partenaire/naming-analyzer/` | Conventions de nommage du projet |
| 2 | **lesson-learned** | `skills-main/skills-partenaire/lesson-learned/` | Patterns issus de l'historique git |
| 2 | **openapi-to-typescript** | `skills-main/skills-partenaire/openapi-to-typescript/` | Types API, interfaces existantes |
| 3 | **supabase** | `.agents/skills/supabase/` | Patterns requêtes, RLS, Auth |
| 3 | **supabase-postgres-best-practices** | `.agents/skills/supabase-postgres-best-practices/` | Patterns SQL, index |
| 3 | **database-schema-designer** | `skills-main/skills-partenaire/database-schema-designer/` | Schéma tables `tasks`, `projects`, etc. |
| 4 | **webapp-testing** | `skills-main/skills-partenaire/webapp-testing/` | Exemples de tests existants |
| 4 | **qa-test-planner** | `skills-main/skills-partenaire/qa-test-planner/` | Structure tests similaires |
| 4 | **backend-to-frontend-handoff-docs** | `skills-main/skills-partenaire/backend-to-frontend-handoff-docs/` | Patterns doc API |
| 4 | **frontend-to-backend-requirements** | `skills-main/skills-partenaire/frontend-to-backend-requirements/` | Patterns communication front/back |
| 5 | **memoire-favor** | `.skills/memoire-favor/` | wiki/erreurs/, bonnes-pratiques/ |

## Zones de recherche UrsUle

| Zone | Chemin | Patterns typiques |
|------|--------|-------------------|
| Services API | `src/services/` | Appels Supabase, exports |
| Stores Pinia | `src/stores/` | State, actions async |
| Composants | `src/components/` | shadcn-vue, slide-over |
| Vues | `src/views/` | Pages feature |
| Migrations | `supabase/migrations/` | Schéma, RLS |

## Spécifications

[`docs_index.md`](../../../../.skills/ChefsUrsUle/references/docs_index.md) — `prompt/TDD.md`, `prompt/API_URSULE.md`.

## Délégation (accord ChefsUrsUle)

Voir [delegation_matrix.md](delegation_matrix.md).

| Agent cible | Quand proposer |
|-------------|----------------|
| **mermaid-diagram-specialist** | Visualiser l'architecture ou flux trouvés |
| **general-purpose** | Tâche élargie au-delà de la recherche de patterns |

1. `[DEMANDE DÉLÉGATION → ChefsUrsUle]` → attendre approbation → intégrer le livrable.

## Protocole

1. Grep/Glob/Read uniquement — documenter patterns trouvés avec `fichier:ligne`.
2. Ne pas suggérer d'amélioration sauf demande ChefsUrsUle.
3. Croiser avec wiki/erreurs/ si bug connu sur le pattern.
