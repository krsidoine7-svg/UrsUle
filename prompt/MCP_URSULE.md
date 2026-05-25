# 🔌 MCP-UrsUle — Serveur MCP pour Connecter UrsUle à Tous Tes Projets
**Version :** 1.0.0  
**Technologie :** Node.js + TypeScript + MCP SDK officiel  
**Connexion :** Supabase (base de données UrsUle)  
**Objectif :** Permettre à n'importe quel projet IA ou app d'interagir avec UrsUle via le protocole MCP

---

## 🧠 C'EST QUOI LE MCP ?

> Le **Model Context Protocol (MCP)** est un standard ouvert (créé par Anthropic) qui permet à un assistant IA (Claude, Copilot, Cursor...) de se connecter à TES outils et données, comme si c'était des plugins.

**Analogie simple :**
- Ton projet UrsUle = une usine avec des machines (créer tâche, lire stats, compléter projet...)
- Le MCP Server = la télécommande universelle de l'usine
- Claude / Cursor / ton autre projet = la main qui tient la télécommande

**Ce que ça va te permettre :**
- Depuis Claude → "Crée une tâche urgente dans UrsUle pour demain"
- Depuis ton app de facturation → synchroniser automatiquement les projets terminés
- Depuis ton app de vidéo-coding → créer des tâches d'apprentissage dans UrsUle
- Depuis n'importe quel outil qui parle MCP → accéder à tes données UrsUle

---

## 🗺️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                    TES PROJETS (Clients MCP)                │
│  Claude Desktop │ Cursor │ App Facturation │ App Vidéo...   │
└────────────────────────────┬────────────────────────────────┘
                             │ MCP Protocol (JSON-RPC over stdio/SSE)
┌────────────────────────────▼────────────────────────────────┐
│                    mcp-UrsUle (Serveur MCP)                 │
│                                                             │
│  OUTILS DISPONIBLES :                                       │
│  ├── task_create        Créer une tâche                     │
│  ├── task_list          Lister les tâches (avec filtres)    │
│  ├── task_get           Détail d'une tâche                  │
│  ├── task_update        Modifier une tâche                  │
│  ├── task_complete      Compléter une tâche                 │
│  ├── task_delete        Supprimer une tâche                 │
│  ├── project_create     Créer un projet                     │
│  ├── project_list       Lister les projets                  │
│  ├── project_get        Détail d'un projet                  │
│  ├── stats_get          Récupérer les statistiques          │
│  ├── category_list      Lister les catégories               │
│  └── user_get_profile   Profil de l'utilisateur             │
│                                                             │
│  RESSOURCES DISPONIBLES :                                   │
│  ├── ursule://tasks/{id}       Tâche par ID                 │
│  ├── ursule://projects/{id}    Projet par ID                │
│  └── ursule://dashboard        Données du dashboard         │
└────────────────────────────┬────────────────────────────────┘
                             │ Supabase JS Client (REST + Realtime)
┌────────────────────────────▼────────────────────────────────┐
│              Supabase PostgreSQL (Données UrsUle)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 STRUCTURE DU PROJET mcp-UrsUle

```
mcp-ursule/
├── src/
│   ├── index.ts              # Point d'entrée du serveur MCP
│   ├── server.ts             # Configuration serveur MCP
│   ├── supabase.ts           # Client Supabase
│   ├── auth.ts               # Gestion authentification
│   ├── tools/                # Tous les outils MCP
│   │   ├── tasks.tools.ts    # Outils tâches (CRUD)
│   │   ├── projects.tools.ts # Outils projets
│   │   ├── stats.tools.ts    # Outils statistiques
│   │   └── categories.tools.ts
│   ├── resources/            # Ressources MCP (lecture)
│   │   ├── tasks.resources.ts
│   │   └── dashboard.resources.ts
│   └── types.ts              # Types partagés
├── dist/                     # Build compilé (généré)
├── .env                      # Variables d'environnement
├── .env.example              # Template env
├── package.json
├── tsconfig.json
└── README.md
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 0 — PRÉREQUIS & COMPRÉHENSION
## ═══════════════════════════════════════════

**Avant de coder, vérifie que tu as :**

```bash
# Vérifier Node.js (besoin de v18+)
node --version   # doit afficher v18.x.x ou supérieur

# Vérifier npm
npm --version    # doit afficher 9.x.x ou supérieur

# Si Node < 18, télécharger sur https://nodejs.org
```

**Comprends le flux MCP :**
```
Client (Claude) → envoie un appel JSON → mcp-UrsUle reçoit 
→ appelle Supabase → récupère les données → renvoie la réponse → Claude l'utilise
```

**Deux modes de connexion possibles :**
- `stdio` → pour Claude Desktop et Cursor (connexion locale, via terminal)
- `SSE (HTTP)` → pour des apps web distantes (connexion réseau)

> Pour ce guide, on commence par **stdio** (plus simple à tester), puis on ajoute **SSE**.

✅ **Validation étape 0 :** Tu peux répondre à "c'est quoi un outil MCP ?" en une phrase.

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 1 — INITIALISATION DU PROJET
## ═══════════════════════════════════════════

**Copie ce bloc dans ton IA (Cursor/terminal) :**

```bash
# 1. Créer le dossier du projet MCP (SÉPARÉ de ton projet UrsUle)
mkdir mcp-ursule
cd mcp-ursule

# 2. Initialiser le projet Node.js
npm init -y

# 3. Installer les dépendances OBLIGATOIRES
npm install @modelcontextprotocol/sdk @supabase/supabase-js zod dotenv

# 4. Installer les dépendances de développement
npm install -D typescript @types/node ts-node nodemon

# 5. Créer la structure des dossiers
mkdir -p src/tools src/resources

# 6. Créer le tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 7. Créer le .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
EOF

# 8. Créer le .env.example
cat > .env.example << 'EOF'
# Supabase UrsUle (copier depuis ton projet UrsUle)
SUPABASE_URL=https://TON_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Clé SERVICE ROLE (pas anon !)

# Identité du serveur MCP
MCP_SERVER_NAME=mcp-ursule
MCP_SERVER_VERSION=1.0.0

# Utilisateur UrsUle par défaut (ton user ID Supabase)
DEFAULT_USER_ID=TON_USER_ID_UUID
EOF

# 9. Copier et remplir le .env
cp .env.example .env
# ⚠️ Remplis maintenant le .env avec tes vraies valeurs !
```

**Remplir le .env :**
- `SUPABASE_URL` → Dashboard Supabase → Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY` → Dashboard Supabase → Settings → API → service_role (secret !)
- `DEFAULT_USER_ID` → Dans Supabase → Authentication → Users → ton email → copier l'ID

> ⚠️ **IMPORTANT** : La `service_role` key bypass le RLS. Ne jamais la mettre dans le code front-end.

✅ **Validation étape 1 :**
```bash
ls src/  # doit afficher : tools/  resources/
cat .env  # doit avoir des vraies valeurs (pas "TON_ID")
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 2 — CLIENT SUPABASE & TYPES
## ═══════════════════════════════════════════

**Crée `src/supabase.ts` :**

```typescript
// src/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Variables manquantes dans .env : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis'
  )
}

// Client avec service_role pour bypasser RLS (usage serveur uniquement)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? ''

console.error('[mcp-ursule] ✅ Supabase client initialisé')
```

**Crée `src/types.ts` :**

```typescript
// src/types.ts
// Types partagés dans tout le serveur MCP

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived' | 'rescheduled' | 'to_redo'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  category_id?: string
  project_id?: string
  deadline?: string
  estimated_duration_minutes?: number
  actual_duration_minutes: number
  is_pinned: boolean
  tags: string[]
  appreciation?: string
  completed_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  status: ProjectStatus
  deadline?: string
  budget?: number
  budget_currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  is_system: boolean
}

// Réponse standardisée pour tous les outils MCP
export interface McpResult {
  success: boolean
  data?: unknown
  error?: string
  message?: string
}
```

**Ajoute les scripts dans `package.json` :**

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "watch": "nodemon --exec ts-node src/index.ts"
  }
}
```

✅ **Validation étape 2 :**
```bash
# Tester que Supabase se connecte
npx ts-node -e "import './src/supabase'; console.log('OK')"
# Doit afficher : [mcp-ursule] ✅ Supabase client initialisé
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 3 — SERVEUR MCP MINIMAL (Hello World)
## ═══════════════════════════════════════════

**Crée `src/index.ts` :**

```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import * as dotenv from 'dotenv'

dotenv.config()

// Créer le serveur MCP
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME ?? 'mcp-ursule',
    version: process.env.MCP_SERVER_VERSION ?? '1.0.0',
  },
  {
    capabilities: {
      tools: {},      // On expose des outils
      resources: {},  // On expose des ressources
    },
  }
)

// ═══ OUTIL DE TEST : ping ═══
// Outil minimal pour valider que le serveur fonctionne
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ping',
        description: 'Vérifie que le serveur mcp-UrsUle est en ligne',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message optionnel à renvoyer',
            },
          },
          required: [],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'ping') {
    const msg = (args as { message?: string })?.message ?? 'pong'
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            server: 'mcp-ursule',
            version: '1.0.0',
            message: msg,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    }
  }

  // Outil non trouvé
  throw new Error(`Outil inconnu : ${name}`)
})

// Démarrer le serveur avec transport stdio
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[mcp-ursule] 🚀 Serveur MCP démarré (mode stdio)')
}

main().catch((error) => {
  console.error('[mcp-ursule] ❌ Erreur fatale:', error)
  process.exit(1)
})
```

**Build et premier test :**

```bash
# Compiler
npm run build

# Tester manuellement (mode stdio — input/output JSON)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

**Tu dois voir quelque chose comme :**
```json
{"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"ping","description":"Vérifie que le serveur mcp-UrsUle est en ligne",...}]}}
```

✅ **Validation étape 3 :**
```bash
npm run build  # → 0 erreur TypeScript
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
# → Voir la liste des outils avec "ping"
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 4 — CONNEXION À CLAUDE DESKTOP
## ═══════════════════════════════════════════

**Trouve le fichier de config Claude Desktop :**

```bash
# Sur Mac :
open ~/Library/Application\ Support/Claude/

# Sur Windows :
# C:\Users\TON_NOM\AppData\Roaming\Claude\

# Le fichier s'appelle : claude_desktop_config.json
```

**Ajoute mcp-UrsUle dans la config Claude Desktop :**

```json
{
  "mcpServers": {
    "mcp-ursule": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/vers/mcp-ursule/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://TON_ID.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGci...",
        "DEFAULT_USER_ID": "TON_USER_ID"
      }
    }
  }
}
```

> **Remplace `/CHEMIN/ABSOLU/vers/mcp-ursule/`** par le vrai chemin de ton dossier.  
> Sur Mac exemple : `/Users/krsidoine/projets/mcp-ursule/dist/index.js`

**Redémarre Claude Desktop** complètement (quit + relaunch).

**Test dans Claude Desktop :**
> Tape dans Claude : "Utilise l'outil ping de mcp-ursule"

Tu dois voir Claude utiliser l'outil et retourner le JSON de réponse.

✅ **Validation étape 4 :**
- Claude Desktop voit le serveur (icône de connexion dans la barre)
- La commande ping retourne une réponse JSON avec `"success": true`

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 5 — OUTIL : LISTER LES TÂCHES
## ═══════════════════════════════════════════

**Crée `src/tools/tasks.tools.ts` :**

```typescript
// src/tools/tasks.tools.ts
import { z } from 'zod'
import { supabase, DEFAULT_USER_ID } from '../supabase.js'
import type { Task, TaskStatus, TaskPriority, McpResult } from '../types.js'

// ─── Schémas de validation Zod ───────────────────────────────
export const TaskListSchema = z.object({
  user_id: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived', 'rescheduled', 'to_redo']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

export const TaskGetSchema = z.object({
  task_id: z.string().uuid('ID de tâche invalide'),
})

// ─── Définitions des outils (pour ListTools) ─────────────────
export const taskToolDefinitions = [
  {
    name: 'task_list',
    description: `Liste les tâches de l'utilisateur UrsUle. 
    Peut filtrer par statut (todo, in_progress, done, archived, rescheduled, to_redo), 
    par priorité (low, normal, high, urgent), et par recherche textuelle.
    Retourne les tâches triées par date de création décroissante.`,
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done', 'archived', 'rescheduled', 'to_redo'],
          description: 'Filtrer par statut',
        },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'urgent'],
          description: 'Filtrer par priorité',
        },
        limit: {
          type: 'number',
          description: 'Nombre de tâches à retourner (max 100, défaut 20)',
          default: 20,
        },
        search: {
          type: 'string',
          description: 'Recherche dans le titre des tâches',
        },
      },
      required: [],
    },
  },
  {
    name: 'task_get',
    description: `Récupère les détails complets d'une tâche UrsUle par son ID.
    Inclut : description, sous-tâches, catégorie, projet, temps passé, appréciation.`,
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: "UUID de la tâche UrsUle",
        },
      },
      required: ['task_id'],
    },
  },
]

// ─── Handlers des outils ─────────────────────────────────────

export async function handleTaskList(args: unknown): Promise<McpResult> {
  try {
    const params = TaskListSchema.parse(args)
    const userId = params.user_id ?? DEFAULT_USER_ID

    let query = supabase
      .from('tasks')
      .select(`
        id, title, status, priority, deadline, is_pinned, tags, 
        appreciation, completed_at, created_at, estimated_duration_minutes,
        category:categories(id, name, color),
        project:projects(id, name, color)
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('parent_task_id', null) // Pas de sous-tâches dans la liste principale
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(params.limit)

    if (params.status) query = query.eq('status', params.status)
    if (params.priority) query = query.eq('priority', params.priority)
    if (params.search) query = query.ilike('title', `%${params.search}%`)

    const { data, error } = await query
    if (error) throw error

    return {
      success: true,
      data: {
        tasks: data,
        count: data.length,
        filters_applied: {
          status: params.status,
          priority: params.priority,
          search: params.search,
        },
      },
      message: `${data.length} tâche(s) trouvée(s)`,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

export async function handleTaskGet(args: unknown): Promise<McpResult> {
  try {
    const { task_id } = TaskGetSchema.parse(args)

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon),
        project:projects(id, name, color, status),
        subtasks:tasks!parent_task_id(id, title, status, deadline),
        comments:task_comments(id, content, created_at),
        images:task_images(id, storage_path, filename)
      `)
      .eq('id', task_id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Tâche ${task_id} introuvable`)

    return {
      success: true,
      data: data,
      message: `Tâche "${data.title}" récupérée`,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}
```

**Mets à jour `src/index.ts` pour intégrer les nouveaux outils :**

```typescript
// src/index.ts — version mise à jour
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import * as dotenv from 'dotenv'
import { taskToolDefinitions, handleTaskList, handleTaskGet } from './tools/tasks.tools.js'

dotenv.config()

const server = new Server(
  { name: 'mcp-ursule', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
)

// ═══ Liste de TOUS les outils ═══
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Outil de test
      { name: 'ping', description: 'Vérifie que mcp-UrsUle est en ligne', inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: [] } },
      // Outils tâches
      ...taskToolDefinitions,
    ],
  }
})

// ═══ Routeur des appels d'outils ═══
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  let result: unknown

  switch (name) {
    case 'ping':
      result = { success: true, server: 'mcp-ursule', timestamp: new Date().toISOString() }
      break
    case 'task_list':
      result = await handleTaskList(args)
      break
    case 'task_get':
      result = await handleTaskGet(args)
      break
    default:
      throw new Error(`Outil inconnu : ${name}`)
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[mcp-ursule] 🚀 Serveur démarré')
}
main().catch(console.error)
```

✅ **Validation étape 5 :**
```bash
npm run build
# Dans Claude Desktop, tape :
# "Liste mes 5 dernières tâches UrsUle"
# → Claude doit afficher tes vraies tâches depuis Supabase
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 6 — OUTIL : CRÉER UNE TÂCHE
## ═══════════════════════════════════════════

**Ajoute dans `src/tools/tasks.tools.ts` :**

```typescript
// Ajouter ces exports à tasks.tools.ts

import { z } from 'zod'

// Schéma de création
export const TaskCreateSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(255, 'Titre trop long'),
  description: z.string().max(10000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['todo', 'in_progress']).default('todo'),
  deadline: z.string().datetime({ message: 'Format ISO 8601 requis : 2025-01-15T10:00:00Z' }).optional(),
  estimated_duration_minutes: z.number().int().min(1).max(10080).optional(),
  tags: z.array(z.string()).max(10).default([]),
  category_name: z.string().optional(), // Nom de catégorie (on va chercher l'ID)
  project_name: z.string().optional(),  // Nom de projet (on va chercher l'ID)
  is_pinned: z.boolean().default(false),
  validation_type: z.enum(['calc', 'question', 'none']).default('calc'),
})

// Définition de l'outil
export const taskCreateDefinition = {
  name: 'task_create',
  description: `Crée une nouvelle tâche dans UrsUle.
  Tu peux spécifier un titre, une description, une priorité (low/normal/high/urgent),
  un statut initial, une deadline (format ISO 8601), une durée estimée en minutes,
  des tags, une catégorie (par nom), un projet (par nom).
  Exemple : "Créer une tâche urgente 'Appeler client X' pour demain"`,
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Titre de la tâche (obligatoire)' },
      description: { type: 'string', description: 'Description détaillée (Markdown supporté)' },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
      status: { type: 'string', enum: ['todo', 'in_progress'], default: 'todo' },
      deadline: { type: 'string', description: 'Deadline en ISO 8601 : 2025-01-15T10:00:00Z' },
      estimated_duration_minutes: { type: 'number', description: 'Durée estimée en minutes' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Tags libres' },
      category_name: { type: 'string', description: "Nom de la catégorie (ex: 'Travail')" },
      project_name: { type: 'string', description: "Nom du projet (ex: 'Site E-commerce')" },
      is_pinned: { type: 'boolean', description: 'Épingler la tâche en haut', default: false },
    },
    required: ['title'],
  },
}

export async function handleTaskCreate(args: unknown): Promise<McpResult> {
  try {
    const params = TaskCreateSchema.parse(args)

    // Résoudre l'ID de catégorie par nom si fourni
    let categoryId: string | undefined
    if (params.category_name) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', DEFAULT_USER_ID)
        .ilike('name', params.category_name)
        .single()
      categoryId = cat?.id
    }

    // Résoudre l'ID de projet par nom si fourni
    let projectId: string | undefined
    if (params.project_name) {
      const { data: proj } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', DEFAULT_USER_ID)
        .ilike('name', params.project_name)
        .single()
      projectId = proj?.id
    }

    // Créer la tâche
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: DEFAULT_USER_ID,
        title: params.title,
        description: params.description,
        priority: params.priority,
        status: params.status,
        deadline: params.deadline,
        estimated_duration_minutes: params.estimated_duration_minutes,
        tags: params.tags,
        category_id: categoryId,
        project_id: projectId,
        is_pinned: params.is_pinned,
        validation_type: params.validation_type,
      })
      .select('*')
      .single()

    if (error) throw error

    return {
      success: true,
      data: data,
      message: `✅ Tâche "${params.title}" créée avec succès ! ID : ${data.id}`,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}
```

**Ajoute dans le switch de `index.ts` :**
```typescript
case 'task_create':
  result = await handleTaskCreate(args)
  break
```

**Et dans `ListToolsRequestSchema` :**
```typescript
taskCreateDefinition,
```

✅ **Validation étape 6 :**
```bash
npm run build
# Dans Claude Desktop :
# "Crée une tâche 'Revoir le document UrsUle' priorité haute, deadline demain"
# → Claude doit créer la tâche et afficher son ID
# → Vérifier dans l'app UrsUle que la tâche apparaît vraiment
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 7 — OUTILS : UPDATE, COMPLETE, DELETE
## ═══════════════════════════════════════════

**Ajoute dans `src/tools/tasks.tools.ts` :**

```typescript
// ─── UPDATE ────────────────────────────────────────────────
export const TaskUpdateSchema = z.object({
  task_id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived', 'rescheduled', 'to_redo']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  deadline: z.string().datetime().optional(),
  is_pinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export async function handleTaskUpdate(args: unknown): Promise<McpResult> {
  const { task_id, ...updates } = TaskUpdateSchema.parse(args)
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', task_id)
    .eq('user_id', DEFAULT_USER_ID)
    .select()
    .single()
  if (error) return { success: false, error: error.message }
  return { success: true, data, message: `Tâche "${data.title}" mise à jour` }
}

// ─── COMPLETE (avec bypass gamification pour le MCP) ──────────
export const TaskCompleteSchema = z.object({
  task_id: z.string().uuid(),
  appreciation: z.enum(['happy','too_hard','boring','nothing_learned','super_productive','stressful','enriching','neutral']).optional(),
  note: z.string().optional(), // Note optionnelle ajoutée comme commentaire
})

export async function handleTaskComplete(args: unknown): Promise<McpResult> {
  const { task_id, appreciation, note } = TaskCompleteSchema.parse(args)
  
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      appreciation: appreciation ?? 'neutral',
      updated_at: new Date().toISOString(),
    })
    .eq('id', task_id)
    .eq('user_id', DEFAULT_USER_ID)
    .select()
    .single()
  
  if (error) return { success: false, error: error.message }
  
  // Ajouter un commentaire si fourni
  if (note) {
    await supabase.from('task_comments').insert({
      task_id,
      user_id: DEFAULT_USER_ID,
      content: `[Complété via MCP] ${note}`,
    })
  }
  
  return {
    success: true,
    data,
    message: `✅ Tâche "${data.title}" marquée comme terminée !`,
  }
}

// ─── DELETE (soft delete) ──────────────────────────────────
export const TaskDeleteSchema = z.object({
  task_id: z.string().uuid(),
})

export async function handleTaskDelete(args: unknown): Promise<McpResult> {
  const { task_id } = TaskDeleteSchema.parse(args)
  
  // Récupérer le titre avant suppression
  const { data: task } = await supabase
    .from('tasks').select('title').eq('id', task_id).single()
  
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', task_id)
    .eq('user_id', DEFAULT_USER_ID)
  
  if (error) return { success: false, error: error.message }
  return {
    success: true,
    message: `🗑️ Tâche "${task?.title}" déplacée dans la corbeille`,
  }
}
```

**Ajoute les définitions et cases dans `index.ts` :**
```typescript
// Dans ListTools :
{ name: 'task_update', description: "Modifie une tâche existante", inputSchema: {...} },
{ name: 'task_complete', description: "Marque une tâche comme terminée", inputSchema: {...} },
{ name: 'task_delete', description: "Supprime une tâche (corbeille)", inputSchema: {...} },

// Dans le switch :
case 'task_update': result = await handleTaskUpdate(args); break
case 'task_complete': result = await handleTaskComplete(args); break
case 'task_delete': result = await handleTaskDelete(args); break
```

✅ **Validation étape 7 :**
```bash
npm run build
# Test 1 : "Change la priorité de la tâche [ID] à urgente"
# Test 2 : "Marque la tâche [ID] comme terminée, appréciation: happy"
# Test 3 : "Supprime la tâche [ID]"
# → Vérifier chaque action dans l'app UrsUle
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 8 — OUTILS PROJETS & CATÉGORIES
## ═══════════════════════════════════════════

**Crée `src/tools/projects.tools.ts` :**

```typescript
// src/tools/projects.tools.ts
import { z } from 'zod'
import { supabase, DEFAULT_USER_ID } from '../supabase.js'
import type { McpResult } from '../types.js'

export const projectToolDefinitions = [
  {
    name: 'project_list',
    description: 'Liste tous les projets UrsUle avec leur progression',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] },
      },
      required: [],
    },
  },
  {
    name: 'project_create',
    description: 'Crée un nouveau projet dans UrsUle',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom du projet (obligatoire)' },
        description: { type: 'string' },
        deadline: { type: 'string', description: 'Deadline ISO 8601' },
        budget: { type: 'number', description: 'Budget en FCFA' },
        color: { type: 'string', description: 'Couleur hex (#10B981)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'project_get',
    description: 'Détails complets d\'un projet avec ses tâches et progression',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },
]

export async function handleProjectList(args: unknown): Promise<McpResult> {
  const schema = z.object({ status: z.string().optional() })
  const { status } = schema.parse(args ?? {})

  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: projects, error } = await query
  if (error) return { success: false, error: error.message }

  // Calculer la progression de chaque projet
  const projectsWithProgress = await Promise.all(
    projects.map(async (proj) => {
      const { count: total } = await supabase
        .from('tasks').select('*', { count: 'exact', head: true })
        .eq('project_id', proj.id).is('deleted_at', null)
      const { count: done } = await supabase
        .from('tasks').select('*', { count: 'exact', head: true })
        .eq('project_id', proj.id).eq('status', 'done').is('deleted_at', null)
      return {
        ...proj,
        task_count: total ?? 0,
        completed_count: done ?? 0,
        progress_percent: total ? Math.round(((done ?? 0) / total) * 100) : 0,
      }
    })
  )

  return { success: true, data: projectsWithProgress, message: `${projects.length} projet(s)` }
}

export async function handleProjectCreate(args: unknown): Promise<McpResult> {
  const schema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    deadline: z.string().datetime().optional(),
    budget: z.number().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981'),
  })
  const params = schema.parse(args)
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...params, user_id: DEFAULT_USER_ID })
    .select().single()
  if (error) return { success: false, error: error.message }
  return { success: true, data, message: `✅ Projet "${data.name}" créé !` }
}

export async function handleProjectGet(args: unknown): Promise<McpResult> {
  const { project_id } = z.object({ project_id: z.string().uuid() }).parse(args)
  const { data, error } = await supabase
    .from('projects')
    .select(`*, tasks(id, title, status, priority, deadline)`)
    .eq('id', project_id).single()
  if (error) return { success: false, error: error.message }
  return { success: true, data }
}
```

**Crée `src/tools/categories.tools.ts` :**

```typescript
// src/tools/categories.tools.ts
import { supabase, DEFAULT_USER_ID } from '../supabase.js'
import type { McpResult } from '../types.js'

export const categoryToolDefinitions = [
  {
    name: 'category_list',
    description: 'Liste toutes les catégories UrsUle (statiques et personnalisées)',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
]

export async function handleCategoryList(): Promise<McpResult> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
    .order('sort_order')
  if (error) return { success: false, error: error.message }
  return { success: true, data, message: `${data.length} catégorie(s)` }
}
```

✅ **Validation étape 8 :**
```bash
npm run build
# "Liste mes projets UrsUle actifs avec leur progression"
# "Crée un projet 'Refonte Site Web' deadline dans 2 mois"
# "Quelles sont mes catégories UrsUle ?"
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 9 — OUTIL STATISTIQUES
## ═══════════════════════════════════════════

**Crée `src/tools/stats.tools.ts` :**

```typescript
// src/tools/stats.tools.ts
import { z } from 'zod'
import { supabase, DEFAULT_USER_ID } from '../supabase.js'
import type { McpResult } from '../types.js'

export const statsToolDefinitions = [
  {
    name: 'stats_get',
    description: `Récupère les statistiques de productivité UrsUle.
    Peut retourner les stats du jour, de la semaine, du mois, ou d'une période personnalisée.
    Inclut : tâches créées, complétées, taux de complétion, répartition par priorité et catégorie.`,
    inputSchema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month', 'custom'],
          description: "Période des statistiques",
          default: 'week',
        },
        date_from: { type: 'string', description: 'Date début (ISO, si period=custom)' },
        date_to: { type: 'string', description: 'Date fin (ISO, si period=custom)' },
      },
      required: [],
    },
  },
]

export async function handleStatsGet(args: unknown): Promise<McpResult> {
  const schema = z.object({
    period: z.enum(['today', 'week', 'month', 'custom']).default('week'),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  })
  const { period, date_from, date_to } = schema.parse(args ?? {})

  // Calculer les dates selon la période
  const now = new Date()
  let from: Date, to: Date

  if (period === 'today') {
    from = new Date(now.setHours(0, 0, 0, 0))
    to = new Date()
  } else if (period === 'week') {
    from = new Date(now)
    from.setDate(now.getDate() - 7)
    to = new Date()
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to = new Date()
  } else {
    from = new Date(date_from ?? new Date().toISOString())
    to = new Date(date_to ?? new Date().toISOString())
  }

  const fromISO = from.toISOString()
  const toISO = to.toISOString()

  // Requêtes parallèles pour les stats
  const [
    { count: totalCreated },
    { count: totalCompleted },
    { count: totalOverdue },
    { data: priorityBreakdown },
    { data: appreciationBreakdown },
    { data: recentCompleted },
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', DEFAULT_USER_ID).is('deleted_at', null)
      .gte('created_at', fromISO).lte('created_at', toISO),
    
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', DEFAULT_USER_ID).eq('status', 'done')
      .gte('completed_at', fromISO).lte('completed_at', toISO),
    
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', DEFAULT_USER_ID).neq('status', 'done')
      .is('deleted_at', null).lt('deadline', toISO),
    
    supabase.from('tasks').select('priority')
      .eq('user_id', DEFAULT_USER_ID).is('deleted_at', null).neq('status', 'done'),
    
    supabase.from('tasks').select('appreciation')
      .eq('user_id', DEFAULT_USER_ID).eq('status', 'done')
      .gte('completed_at', fromISO).not('appreciation', 'is', null),

    supabase.from('tasks').select('id, title, completed_at, appreciation')
      .eq('user_id', DEFAULT_USER_ID).eq('status', 'done')
      .gte('completed_at', fromISO).order('completed_at', { ascending: false }).limit(5),
  ])

  const completionRate = totalCreated 
    ? Math.round(((totalCompleted ?? 0) / totalCreated) * 100) 
    : 0

  // Agréger les priorités
  const priorities: Record<string, number> = {}
  priorityBreakdown?.forEach(t => {
    priorities[t.priority] = (priorities[t.priority] ?? 0) + 1
  })

  // Agréger les appréciations
  const moods: Record<string, number> = {}
  appreciationBreakdown?.forEach(t => {
    if (t.appreciation) moods[t.appreciation] = (moods[t.appreciation] ?? 0) + 1
  })

  return {
    success: true,
    data: {
      period,
      date_range: { from: fromISO, to: toISO },
      summary: {
        tasks_created: totalCreated ?? 0,
        tasks_completed: totalCompleted ?? 0,
        tasks_overdue: totalOverdue ?? 0,
        completion_rate_percent: completionRate,
      },
      by_priority: priorities,
      mood_distribution: moods,
      recently_completed: recentCompleted,
    },
    message: `Stats ${period} : ${totalCompleted}/${totalCreated} tâches complétées (${completionRate}%)`,
  }
}
```

✅ **Validation étape 9 :**
```bash
npm run build
# "Donne-moi mes stats de productivité cette semaine"
# "Quel est mon taux de complétion du mois de janvier ?"
# "Combien de tâches urgentes j'ai en attente ?"
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 10 — RESSOURCES MCP
## ═══════════════════════════════════════════

Les **ressources** MCP = des données lisibles (pas des actions).  
Elles peuvent être exposées comme des URL pour que Claude les lise en contexte.

**Crée `src/resources/dashboard.resources.ts` :**

```typescript
// src/resources/dashboard.resources.ts
import { supabase, DEFAULT_USER_ID } from '../supabase.js'

export const resourceDefinitions = [
  {
    uri: 'ursule://dashboard',
    name: 'Dashboard UrsUle',
    description: 'Vue d\'ensemble du jour : tâches urgentes, en retard, statistiques rapides',
    mimeType: 'application/json',
  },
  {
    uri: 'ursule://tasks/today',
    name: 'Tâches du jour',
    description: 'Toutes les tâches avec deadline aujourd\'hui',
    mimeType: 'application/json',
  },
]

export async function getDashboardResource(): Promise<string> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0]

  const [
    { data: todayTasks },
    { data: urgentTasks },
    { data: overdueTasks },
    { count: totalActive },
  ] = await Promise.all([
    supabase.from('tasks').select('id, title, status, priority, deadline')
      .eq('user_id', DEFAULT_USER_ID).is('deleted_at', null).neq('status', 'done')
      .gte('deadline', `${todayStr}T00:00:00`).lt('deadline', `${tomorrowStr}T00:00:00`),
    
    supabase.from('tasks').select('id, title, deadline')
      .eq('user_id', DEFAULT_USER_ID).eq('priority', 'urgent').neq('status', 'done')
      .is('deleted_at', null).limit(5),
    
    supabase.from('tasks').select('id, title, deadline')
      .eq('user_id', DEFAULT_USER_ID).neq('status', 'done').is('deleted_at', null)
      .lt('deadline', new Date().toISOString()).limit(5),
    
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', DEFAULT_USER_ID).in('status', ['todo', 'in_progress']).is('deleted_at', null),
  ])

  return JSON.stringify({
    generated_at: new Date().toISOString(),
    today_tasks: todayTasks,
    urgent_tasks: urgentTasks,
    overdue_tasks: overdueTasks,
    total_active: totalActive,
  }, null, 2)
}
```

**Ajoute les ressources dans `index.ts` :**

```typescript
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { resourceDefinitions, getDashboardResource } from './resources/dashboard.resources.js'

// Lister les ressources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resourceDefinitions,
}))

// Lire une ressource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  if (uri === 'ursule://dashboard' || uri === 'ursule://tasks/today') {
    const content = await getDashboardResource()
    return {
      contents: [{ uri, mimeType: 'application/json', text: content }],
    }
  }

  throw new Error(`Ressource inconnue : ${uri}`)
})
```

✅ **Validation étape 10 :**
```bash
npm run build
# Dans Claude Desktop → les ressources UrsUle apparaissent dans la liste des ressources
# Demander : "Quel est mon dashboard UrsUle aujourd'hui ?"
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 11 — MODE SSE (CONNEXIONS RÉSEAU)
## ═══════════════════════════════════════════

**Pour connecter tes AUTRES projets via HTTP (pas juste Claude Desktop) :**

```typescript
// src/index-sse.ts — Version serveur HTTP avec SSE
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express from 'express'

// npm install express @types/express
const app = express()
app.use(express.json())

// Map pour garder les transports actifs par session
const transports = new Map<string, SSEServerTransport>()

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res)
  const serverId = Math.random().toString(36).slice(2)
  transports.set(serverId, transport)
  
  const server = createMcpServer() // Ton serveur MCP (même logique)
  await server.connect(transport)
  
  req.on('close', () => transports.delete(serverId))
})

app.post('/messages', async (req, res) => {
  // Dispatcher les messages aux transports actifs
  for (const transport of transports.values()) {
    await transport.handlePostMessage(req, res, req.body)
  }
})

const PORT = process.env.PORT ?? 3100
app.listen(PORT, () => {
  console.log(`[mcp-ursule] 🌐 Serveur SSE sur http://localhost:${PORT}`)
})
```

**Ajoute dans `package.json` :**
```json
{
  "scripts": {
    "start:stdio": "node dist/index.js",
    "start:sse": "node dist/index-sse.js",
    "dev:sse": "ts-node src/index-sse.ts"
  }
}
```

**Pour connecter TON AUTRE PROJET au MCP via SSE :**
```typescript
// Dans ton autre projet (ex: app facturation)
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

const client = new Client({ name: 'mon-app-facturation', version: '1.0.0' })
const transport = new SSEClientTransport(new URL('http://localhost:3100/sse'))
await client.connect(transport)

// Appeler un outil UrsUle depuis ton autre app !
const result = await client.callTool('task_create', {
  title: 'Facture client ABC à envoyer',
  priority: 'urgent',
  deadline: '2025-02-01T18:00:00Z',
  category_name: 'Finance',
})

console.log(result) // → { success: true, data: { id: '...', title: '...' } }
```

✅ **Validation étape 11 :**
```bash
npm run start:sse  # → Serveur SSE sur http://localhost:3100
# Depuis un autre terminal :
curl http://localhost:3100/sse  # → Connexion SSE établie
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 12 — MULTI-UTILISATEURS (OPTIONNEL)
## ═══════════════════════════════════════════

**Pour que le MCP gère plusieurs utilisateurs (toi + tes partenaires) :**

```typescript
// Ajouter l'authentification par API Key dans le serveur SSE
// src/auth.ts

import { supabase } from './supabase.js'

export async function getUserIdFromApiKey(apiKey: string): Promise<string | null> {
  // Stocker les API keys dans une table api_keys
  const { data } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', hashApiKey(apiKey))
    .single()
  
  if (!data?.is_active) return null
  return data.user_id
}

function hashApiKey(key: string): string {
  // En production, utiliser crypto.createHash('sha256')
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(key).digest('hex')
}
```

**Table SQL pour les API Keys :**
```sql
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- "App Facturation", "App Vidéo"...
  key_hash TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_own" ON api_keys FOR ALL USING (auth.uid() = user_id);
```

**Usage dans tes autres projets :**
```typescript
// Dans l'app facturation
const client = new Client(...)
// Passer l'API key dans les headers SSE
const transport = new SSEClientTransport(
  new URL('http://mcp-ursule.vercel.app/sse'),
  { headers: { 'X-API-Key': 'ta-cle-api-secrete' } }
)
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 13 — DÉPLOIEMENT SUR VERCEL
## ═══════════════════════════════════════════

```bash
# 1. Créer vercel.json à la racine de mcp-ursule
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [{ "src": "src/index-sse.ts", "use": "@vercel/node" }],
  "routes": [
    { "src": "/sse", "dest": "src/index-sse.ts" },
    { "src": "/messages", "dest": "src/index-sse.ts" }
  ]
}
EOF

# 2. Déployer sur Vercel
npx vercel --prod

# 3. Ajouter les variables d'environnement dans Vercel Dashboard :
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
# DEFAULT_USER_ID
```

**Mettre à jour la config Claude Desktop avec l'URL de prod :**
```json
{
  "mcpServers": {
    "mcp-ursule-remote": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/inspector", "https://mcp-ursule.vercel.app/sse"]
    }
  }
}
```

**Pour tes autres projets distants :**
```typescript
const transport = new SSEClientTransport(
  new URL('https://mcp-ursule.vercel.app/sse')
)
```

---

## 📋 CHECKLIST COMPLÈTE DE VALIDATION

| Étape | Tâche | Validé |
|---|---|---|
| 0 | Prérequis Node.js 18+ | ⬜ |
| 1 | Dossier mcp-ursule initialisé, dépendances installées | ⬜ |
| 2 | Client Supabase connecté, types créés | ⬜ |
| 3 | Serveur minimal avec outil "ping" | ⬜ |
| 4 | Connecté à Claude Desktop, ping fonctionne | ⬜ |
| 5 | task_list retourne les vraies tâches Supabase | ⬜ |
| 6 | task_create crée une vraie tâche dans UrsUle | ⬜ |
| 7 | task_update, task_complete, task_delete fonctionnent | ⬜ |
| 8 | project_list, project_create, category_list | ⬜ |
| 9 | stats_get retourne les bonnes statistiques | ⬜ |
| 10 | Ressources MCP (dashboard) lisibles | ⬜ |
| 11 | Mode SSE pour connexions réseau | ⬜ |
| 12 | Multi-utilisateurs avec API Keys (optionnel) | ⬜ |
| 13 | Déployé sur Vercel | ⬜ |

---

## 🔗 CONNEXIONS POSSIBLES APRÈS DÉPLOIEMENT

| Projet Client | Comment se connecter | Usage |
|---|---|---|
| **Claude Desktop** | `claude_desktop_config.json` (stdio local) | Gestion tâches par IA |
| **Cursor IDE** | Même config que Claude Desktop | Créer tâches depuis le code |
| **App Facturation** | SSEClientTransport HTTP | Sync projets terminés |
| **App Vidéo-Coding** | SSEClientTransport HTTP | Créer tâches d'apprentissage |
| **n8n / Make / Zapier** | HTTP POST vers /messages | Automatisations |
| **Autre projet Vue** | SSEClientTransport | Intégration bi-directionnelle |

---

## 📚 RESSOURCES UTILES

- MCP SDK officiel : https://github.com/modelcontextprotocol/typescript-sdk
- Docs MCP : https://modelcontextprotocol.io/docs
- MCP Inspector (test visuel) : `npx @modelcontextprotocol/inspector`
- Config Claude Desktop : https://modelcontextprotocol.io/quickstart/user

---
*mcp-UrsUle v1.0.0 — Connecte UrsUle à tout ton écosystème de projets*
