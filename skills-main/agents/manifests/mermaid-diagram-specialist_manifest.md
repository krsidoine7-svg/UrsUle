# Manifeste de compétences — mermaid-diagram-specialist

**Profil agent** : [`../mermaid-diagram-specialist.md`](../mermaid-diagram-specialist.md)  
**Orchestrateur** : [ChefsUrsUle](../../../../.skills/ChefsUrsUle/SKILL.md)  
**Manifeste global** : [skills_manifest.md](../../../../.skills/ChefsUrsUle/references/skills_manifest.md)

## Rôle

Expert diagrammes techniques : flowchart, séquence, ERD, C4, états, Gantt. Documente l'architecture UrsUle et les flux métier.

## Skills assignés

| Priorité | Skill | Chemin | Usage |
|----------|-------|--------|-------|
| ⭐ 1 | **skill-mermaidH** | `.skills/skill-mermaidH/` | Skill principal — toujours charger en premier |
| 2 | **c4-architecture** | `skills-main/skills-partenaire/c4-architecture/` | Modèle C4 approfondi |
| 2 | **mermaid-diagrams** | `skills-main/skills-partenaire/mermaid-diagrams/` | Référence syntaxe complémentaire |
| 3 | **claude-mermaid-mcp** | `skills-main/skills-partenaire/claude-mermaid-mcp/` | Preview live MCP (si outils disponibles) |
| 3 | **database-schema-designer** | `skills-main/skills-partenaire/database-schema-designer/` | Source ERD / schéma SQL |
| 3 | **draw-io** | `skills-main/skills-partenaire/draw-io/` | Export draw.io si demandé |
| 3 | **excalidraw** | `skills-main/skills-partenaire/excalidraw/` | Schémas hand-drawn |
| 4 | **doc-coauthoring** | `skills-main/skills-partenaire/doc-coauthoring/` | Intégrer diagrammes dans PRD/TDD |
| 4 | **backend-to-frontend-handoff-docs** | `skills-main/skills-partenaire/backend-to-frontend-handoff-docs/` | Diagrammes de flux API |

## Spécifications UrsUle

| Document | Chemin | Contenu diagrammable |
|----------|--------|----------------------|
| TDD | `prompt/TDD.md` | Architecture, structure modules |
| PKM_BRAIN | `prompt/PKM_BRAIN.md` | Graphe connaissances, flux Brain |
| API | `prompt/API_URSULE.md` | Séquences API, entités |
| SECURITY | `prompt/SECURITY.md` | Flux auth, RLS |

Index : [`docs_index.md`](../../../../.skills/ChefsUrsUle/references/docs_index.md)

## Délégation (accord ChefsUrsUle)

Voir [delegation_matrix.md](delegation_matrix.md).

| Agent cible | Quand proposer |
|-------------|----------------|
| **codebase-pattern-finder** | ERD / séquence à dériver du code existant |
| **ui-ux-designer** | Parcours utilisateur, user journey à valider |
| **communication-excellence-coach** | Diagramme pour doc stakeholder / présentation |

1. `[DEMANDE DÉLÉGATION → ChefsUrsUle]` → attendre approbation → intégrer `[LIVRABLE DÉLÉGATION]`.

## Protocole

1. Charger `@skill-mermaidH` + `references/workflow.md`.
2. Choisir le type via `references/INDEX.md`.
3. Valider avec `scripts/render.mjs` ou preview MCP.
4. Livrer en Markdown intégré au doc cible (`prompt/` ou wiki).
