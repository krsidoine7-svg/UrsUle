# Manifeste de compétences — ui-ux-designer

**Profil agent** : [`../ui-ux-designer.md`](../ui-ux-designer.md)  
**Orchestrateur** : [ChefsUrsUle](../../../../.skills/ChefsUrsUle/SKILL.md)  
**Manifeste global** : [skills_manifest.md](../../../../.skills/ChefsUrsUle/references/skills_manifest.md)

## Rôle

Critique UI/UX fondé sur la recherche. Évalue les interfaces UrsUle (Vue 3 + Tailwind + shadcn-vue), évite l'esthétique générique, aligne sur la charte premium.

## Skills assignés

| Priorité | Skill | Chemin | Usage |
|----------|-------|--------|-------|
| ⭐ 1 | **frontend-design** | `skills-main/skills-partenaire/frontend-design/` | Interfaces premium, micro-animations |
| ⭐ 1 | **theme-factory** | `skills-main/skills-partenaire/theme-factory/` | Tokens, palettes, dark mode |
| 2 | **design-system-starter** | `skills-main/skills-partenaire/design-system-starter/` | Composants, tokens réutilisables |
| 2 | **brand-guidelines** | `skills-main/skills-partenaire/brand-guidelines/` | Règles de marque UrsUle |
| 3 | **canvas-design** | `skills-main/skills-partenaire/canvas-design/` | Graphiques StatsView (Chart.js) |
| 3 | **web-artifacts-builder** | `skills-main/skills-partenaire/web-artifacts-builder/` | Prototypes HTML autonomes |
| 4 | **algorithmic-art** | `skills-main/skills-partenaire/algorithmic-art/` | Visuels génératifs distinctifs |
| 4 | **excalidraw** | `skills-main/skills-partenaire/excalidraw/` | Wireframes hand-drawn |
| 4 | **draw-io** | `skills-main/skills-partenaire/draw-io/` | Schémas layout |
| 4 | **mui** | `skills-main/skills-partenaire/mui/` | Patterns composants (référence cross-framework) |

## Spécifications UrsUle (obligatoires)

| Document | Chemin |
|----------|--------|
| **DESIGN_SYSTEM.md** | `prompt/DESIGN_SYSTEM.md` |
| **PRD** (UX features) | `prompt/PRD.md` |
| **TDD** (composants Vue) | `prompt/TDD.md` |

Couleurs clés : Bleu `#2563EB`, Vert forêt `#16A34A`, typographies Sora + Inter.

## Vues UrsUle prioritaires

`DashboardView.vue`, `TasksView.vue`, `StatsView.vue`, Brain/PKM, modales de suppression (cartographie d'impact UI).

## Délégation (accord ChefsUrsUle)

Voir [delegation_matrix.md](delegation_matrix.md).

| Agent cible | Quand proposer |
|-------------|----------------|
| **ascii-ui-mockup-generator** | Wireframes ASCII avant critique détaillée |
| **codebase-pattern-finder** | Patterns UI/composants déjà dans le repo |
| **mermaid-diagram-specialist** | Flux multi-écrans, parcours utilisateur |

1. `[DEMANDE DÉLÉGATION → ChefsUrsUle]` → attendre approbation → intégrer le livrable.

## Protocole

1. Lire `prompt/DESIGN_SYSTEM.md` avant toute recommandation.
2. Charger frontend-design + theme-factory.
3. Critiquer avec sources (NN/g, données UX) ; proposer alternatives distinctives.
4. Si maquette nécessaire → **proposer** délégation à ascii-ui-mockup-generator via ChefsUrsUle (ne pas lancer directement).
