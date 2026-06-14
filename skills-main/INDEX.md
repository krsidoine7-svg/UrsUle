# Index — skills-main (catalogue UrsUle)

Catalogue central des compétences et outils partenaires orchestrés par **ChefsUrsUle** (`.skills/ChefsUrsUle/`).

> Manifeste opérationnel : [`.skills/ChefsUrsUle/references/skills_manifest.md`](../.skills/ChefsUrsUle/references/skills_manifest.md)

## Arborescence

```
skills-main/
├── AGENTS.md              # Conventions de création de skills (format Agent Skills)
├── INDEX.md               # Ce fichier
├── agents/                # Profils de sous-agents spécialisés (délégation ChefsUrsUle)
├── commands/              # Commandes slash (maintenance du catalogue)
├── skills-partenaire/     # Skills partenaires (Anthropic, Softaworks/agent-toolkit, MCP)
├── spec/                  # Spécification Agent Skills (agentskills.io)
├── template/              # Modèle SKILL.md vierge
├── dist/                  # Plugins packagés (distribution)
└── scripts/               # Scripts utilitaires du dépôt
```

## Compétences UrsUle natives (prioritaires)

| Skill | Chemin | Rôle |
|-------|--------|------|
| **ChefsUrsUle** | `.skills/ChefsUrsUle/` | Orchestrateur central, délégation |
| **skill-mermaidH** | `.skills/skill-mermaidH/` | Diagrammes Mermaid unifiés (skill principal UrsUle) |
| **memoire-favor** | `.skills/memoire-favor/` | Mémoire externe (fourtour/, wiki/) |
| **veille-securite** | `.skills/veille-securite/` | Cybersécurité, RGPD, VDOS.md |
| **supabase** | `.agents/skills/supabase/` | Base de données, Auth, RLS |
| **supabase-postgres-best-practices** | `.agents/skills/supabase-postgres-best-practices/` | Performance PostgreSQL |

## skills-partenaire/

~60 skills partenaires. Voir le manifeste pour la liste complète par catégorie.

**Règle ChefsUrsUle** : toujours préférer un skill UrsUle natif (`skill-mermaidH`, `memoire-favor`, etc.) avant un homologue partenaire.

### Variantes Mermaid (ordre de priorité)

1. `.skills/skill-mermaidH/` — **skill ultime UrsUle** (20+ types, rendu SVG, C4, workflow 5 phases)
2. `skills-partenaire/claude-mermaid-mcp/` — Preview live via MCP (`mermaid_preview`, `mermaid_save`)
3. `skills-partenaire/mermaid-diagrams/` — Guide agent-toolkit (syntaxe, bonnes pratiques)
4. `skills-partenaire/c4-architecture/` — Modèle C4 approfondi

## agents/

Profils pour délégation sous-agent. Chaque agent a un **manifeste de compétences** :

→ [`agents/manifests/INDEX.md`](agents/manifests/INDEX.md)

| Agent | Manifeste |
|-------|-----------|
| general-purpose | `agents/manifests/general-purpose_manifest.md` |
| mermaid-diagram-specialist | `agents/manifests/mermaid-diagram-specialist_manifest.md` |
| ui-ux-designer | `agents/manifests/ui-ux-designer_manifest.md` |
| codebase-pattern-finder | `agents/manifests/codebase-pattern-finder_manifest.md` |
| ascii-ui-mockup-generator | `agents/manifests/ascii-ui-mockup-generator_manifest.md` |
| communication-excellence-coach | `agents/manifests/communication-excellence-coach_manifest.md` |

Manifeste global ChefsUrsUle : [`.skills/ChefsUrsUle/references/skills_manifest.md`](../.skills/ChefsUrsUle/references/skills_manifest.md)

**Délégation inter-agents** : [agents/manifests/delegation_matrix.md](agents/manifests/delegation_matrix.md) (accord ChefsUrsUle obligatoire)

## commands/

| Commande | Fichier | Usage |
|----------|---------|-------|
| sync-skills-readme | `commands/sync-skills-readme.md` | Synchroniser le README avec l'inventaire skills |
