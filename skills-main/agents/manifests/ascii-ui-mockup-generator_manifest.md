# Manifeste de compétences — ascii-ui-mockup-generator

**Profil agent** : [`../ascii-ui-mockup-generator.md`](../ascii-ui-mockup-generator.md)  
**Orchestrateur** : [ChefsUrsUle](../../../../.skills/ChefsUrsUle/SKILL.md)  
**Manifeste global** : [skills_manifest.md](../../../../.skills/ChefsUrsUle/references/skills_manifest.md)

## Rôle

Produit 3 à 5 maquettes ASCII de pages, formulaires ou dashboards **avant** implémentation Vue. Sert de blueprint pour les développeurs.

## Skills assignés

| Priorité | Skill | Chemin | Usage |
|----------|-------|--------|-------|
| ⭐ 1 | **frontend-design** | `skills-main/skills-partenaire/frontend-design/` | Principes layout premium |
| ⭐ 1 | **theme-factory** | `skills-main/skills-partenaire/theme-factory/` | Hiérarchie visuelle, espacements |
| 2 | **design-system-starter** | `skills-main/skills-partenaire/design-system-starter/` | Structure composants |
| 2 | **brand-guidelines** | `skills-main/skills-partenaire/brand-guidelines/` | Cohérence marque UrsUle |
| 3 | **web-artifacts-builder** | `skills-main/skills-partenaire/web-artifacts-builder/` | Passage maquette → prototype HTML |
| 4 | **canvas-design** | `skills-main/skills-partenaire/canvas-design/` | Layouts graphiques / dashboards |
| 4 | **ui-ux-designer** (agent) | `../ui-ux-designer.md` | Revue UX post-sélection maquette |

## Spécifications UrsUle (obligatoires)

| Document | Chemin |
|----------|--------|
| **DESIGN_SYSTEM.md** | `prompt/DESIGN_SYSTEM.md` |
| **PRD** (écrans concernés) | `prompt/PRD.md` |

## Cas d'usage UrsUle typiques

- Nouveau dashboard widget layout
- Slide-over tâche / formulaire
- Modale cartographie d'impact (suppression agent/projet)
- Brain PKM — panneaux rétractables
- Kanban / Calendrier — disposition colonnes

## Délégation (accord ChefsUrsUle)

Voir [delegation_matrix.md](delegation_matrix.md).

| Agent cible | Quand proposer |
|-------------|----------------|
| **ui-ux-designer** | Revue UX / accessibilité après sélection maquette |
| **codebase-pattern-finder** | Trouver layouts ou composants similaires existants |
| **mermaid-diagram-specialist** | Flow multi-écrans lié à la maquette |

1. `[DEMANDE DÉLÉGATION → ChefsUrsUle]` → attendre approbation → intégrer le livrable.

## Protocole

1. Confirmer le besoin avec l'utilisateur ou le brief ChefsUrsUle.
2. Charger frontend-design + lire DESIGN_SYSTEM.md.
3. Générer 3–5 variantes ASCII numérotées + rationale.
4. Après choix utilisateur → breakdown composants pour implémentation Vue.
5. Si validation UX requise → **proposer** délégation à ui-ux-designer via ChefsUrsUle.
