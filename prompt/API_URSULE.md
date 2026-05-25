# ⚡ API-UrsUle — REST API + Documentation Scalar + SDK Client
**Version :** 1.0.0  
**Stack :** Hono.js + TypeScript + Supabase + Vercel Edge + Scalar  
**Objectif :** Une API REST moderne, documentée, et un SDK pour se connecter depuis n'importe quel projet en 1 ligne

---

## 🧠 POURQUOI CETTE API ? (MCP vs API REST)

| | MCP (déjà fait) | API REST (ce guide) |
|---|---|---|
| **Pour qui** | Claude, Cursor, IA | N'importe quelle app, browser, mobile |
| **Protocole** | JSON-RPC (stdio/SSE) | HTTP standard (GET/POST/PUT/DELETE) |
| **Usage** | L'IA appelle tes outils | Ton app web/mobile fait des requêtes |
| **Connexion** | Complexe, protocole spécial | `fetch()` — une ligne |
| **Documentation** | Non standard | Swagger/Scalar — interactif |

> **Les deux sont complémentaires.** L'API REST sert tes apps, le MCP sert les IA.

---

## 🗺️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│             TES PROJETS (Clients de l'API)                  │
│  App UrsUle │ App Facturation │ App Vidéo │ Mobile │ ...    │
│                                                             │
│  // Avec le SDK : UNE SEULE LIGNE                           │
│  const tasks = await ursule.tasks.list({ status: 'todo' })  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS REST
┌────────────────────────────▼────────────────────────────────┐
│                  api-ursule (Hono.js + Vercel Edge)          │
│  https://api.ursule.app/v1                                  │
│                                                             │
│  ENDPOINTS :                                                │
│  POST   /auth/login          → Authentification             │
│  GET    /tasks               → Lister les tâches            │
│  POST   /tasks               → Créer une tâche              │
│  GET    /tasks/:id           → Détail d'une tâche           │
│  PUT    /tasks/:id           → Modifier une tâche           │
│  DELETE /tasks/:id           → Supprimer une tâche          │
│  POST   /tasks/:id/complete  → Compléter une tâche          │
│  GET    /projects            → Lister les projets           │
│  POST   /projects            → Créer un projet              │
│  GET    /projects/:id        → Détail d'un projet           │
│  PUT    /projects/:id        → Modifier un projet           │
│  GET    /categories          → Lister les catégories        │
│  GET    /stats               → Statistiques                 │
│  GET    /dashboard           → Données du dashboard         │
│  GET    /docs                → Documentation Scalar         │
└────────────────────────────┬────────────────────────────────┘
                             │ Supabase JS
┌────────────────────────────▼────────────────────────────────┐
│              Supabase PostgreSQL (Données UrsUle)           │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              @ursule/sdk (Package NPM)                     │
│  npm install @ursule/sdk                                   │
│  → SDK TypeScript qui wrap l'API REST                      │
│  → Une ligne pour tout faire                               │
└────────────────────────────────────────────────────────────┘
```

---

## 📦 STRUCTURE DU PROJET

```
api-ursule/
├── src/
│   ├── index.ts              # Point d'entrée Hono + Scalar
│   ├── supabase.ts           # Client Supabase
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Vérif JWT Supabase
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── cors.middleware.ts      # CORS headers
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── categories.routes.ts
│   │   └── stats.routes.ts
│   ├── schemas/              # Zod schemas (validation + OpenAPI)
│   │   ├── task.schema.ts
│   │   ├── project.schema.ts
│   │   └── common.schema.ts
│   └── types.ts
├── sdk/                      # SDK Client (package séparé)
│   ├── src/
│   │   ├── index.ts          # Point d'entrée SDK
│   │   ├── client.ts         # Classe UrsUleClient
│   │   ├── tasks.ts          # tasks.list(), tasks.create()...
│   │   ├── projects.ts
│   │   └── stats.ts
│   └── package.json          # @ursule/sdk
├── .env
├── vercel.json
├── package.json
└── tsconfig.json
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 0 — PRÉREQUIS & CONCEPTS
## ═══════════════════════════════════════════

**Comprends les outils avant de coder :**

**Hono.js** = Le framework web ultra-rapide pour Vercel Edge Functions.
```
Express.js → populaire mais lourd
Fastify → rapide mais complexe
Hono.js → ultra-rapide, TypeScript-first, tourne sur Vercel Edge en < 50ms
```

**Scalar** = La documentation API moderne (meilleur que Swagger).
```
Swagger UI → vieux, moche
Redoc → beau mais pas interactif
Scalar → beau, interactif, dark mode, "Try it" intégré ✅
```

**Le SDK** = Une mini-librairie que tu publieras (ou utiliseras localement) :
```typescript
// Sans SDK (chaque projet refait la même chose) :
const res = await fetch('https://api.ursule.app/v1/tasks', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const data = await res.json()

// Avec le SDK (1 ligne) :
const tasks = await ursule.tasks.list()
```

✅ **Validation :** Tu as Node 18+, npm 9+, un compte Vercel.

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 1 — INITIALISATION DU PROJET API
## ═══════════════════════════════════════════

```bash
# 1. Créer le dossier (séparé de UrsUle et de mcp-ursule)
mkdir api-ursule && cd api-ursule

# 2. Init Node.js
npm init -y

# 3. Installer Hono + dépendances API
npm install hono @hono/zod-validator zod @scalar/hono-api-reference

# 4. Installer Supabase
npm install @supabase/supabase-js

# 5. Installer outils dev
npm install -D typescript @types/node tsx nodemon

# 6. Créer tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

# 7. Scripts dans package.json
# "dev": "tsx watch src/index.ts",
# "build": "tsc",
# "start": "node dist/index.js"

# 8. Créer la structure
mkdir -p src/middleware src/routes src/schemas

# 9. Créer .env
cat > .env << 'EOF'
SUPABASE_URL=https://TON_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=ton_jwt_secret  # Supabase → Settings → API → JWT Secret
API_VERSION=v1
CORS_ORIGINS=http://localhost:5173,https://ursule.vercel.app
EOF

# 10. Créer vercel.json
cat > vercel.json << 'EOF'
{
  "rewrites": [{ "source": "/(.*)", "destination": "/src/index.ts" }]
}
EOF
```

**Trouve le JWT Secret Supabase :**
> Dashboard Supabase → Project Settings → API → JWT Settings → JWT Secret

✅ **Validation étape 1 :**
```bash
ls src/  # → middleware/ routes/ schemas/
cat .env  # → vraies valeurs présentes
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 2 — SERVEUR HONO MINIMAL + SCALAR
## ═══════════════════════════════════════════

**Crée `src/index.ts` :**

```typescript
// src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { apiReference } from '@scalar/hono-api-reference'

const app = new Hono()

// ─── Middlewares globaux ─────────────────────────────────────
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
  credentials: true,
}))

// ─── Spécification OpenAPI 3.1 ──────────────────────────────
// C'est le "contrat" de ton API — Scalar le lit pour générer la doc
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'UrsUle API',
    version: '1.0.0',
    description: `
# 🐻 API UrsUle

API REST complète pour interagir avec **UrsUle** — ton gestionnaire de tâches et agenda intelligent.

## Authentification
Toutes les routes (sauf \`/health\`) nécessitent un **Bearer Token JWT** Supabase.

\`\`\`bash
Authorization: Bearer eyJhbGci...
\`\`\`

## Obtenir un token
\`\`\`bash
POST /v1/auth/login
{ "email": "krsidoine7@gmail.com", "password": "..." }
\`\`\`

## Intégration en 1 ligne (SDK)
\`\`\`bash
npm install @ursule/sdk
\`\`\`
\`\`\`typescript
import { UrsUleClient } from '@ursule/sdk'
const ursule = new UrsUleClient({ apiKey: 'ton_token' })
const tasks = await ursule.tasks.list()
\`\`\`
    `,
    contact: {
      name: 'Krsidoine',
      email: 'krsidoine7@gmail.com',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Développement local' },
    { url: 'https://api-ursule.vercel.app', description: 'Production' },
  ],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via POST /v1/auth/login',
      },
    },
  },
  paths: {}, // Rempli par chaque router
  tags: [
    { name: 'Auth', description: 'Authentification' },
    { name: 'Tasks', description: 'Gestion des tâches' },
    { name: 'Projects', description: 'Gestion des projets' },
    { name: 'Categories', description: 'Catégories de tâches' },
    { name: 'Stats', description: 'Statistiques de productivité' },
  ],
}

// ─── Route : Spécification OpenAPI (JSON brut) ───────────────
app.get('/openapi.json', (c) => c.json(openApiSpec))

// ─── Route : Documentation Scalar ───────────────────────────
app.get('/docs', apiReference({
  spec: { url: '/openapi.json' },
  theme: 'purple',     // Thème Scalar : purple | blue | green | default
  layout: 'modern',   // Layout moderne Scalar
  defaultHttpClient: {
    targetKey: 'javascript',
    clientKey: 'fetch',
  },
}))

// ─── Route : Health check ────────────────────────────────────
app.get('/health', (c) => c.json({
  status: 'ok',
  service: 'api-ursule',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}))

// ─── Route racine ────────────────────────────────────────────
app.get('/', (c) => c.json({
  name: 'UrsUle API',
  version: 'v1',
  docs: '/docs',
  openapi: '/openapi.json',
  endpoints: {
    auth: '/v1/auth/login',
    tasks: '/v1/tasks',
    projects: '/v1/projects',
    categories: '/v1/categories',
    stats: '/v1/stats',
    dashboard: '/v1/dashboard',
  },
}))

// ─── Routes v1 (montées après) ──────────────────────────────
// (on les ajoutera dans les étapes suivantes)

// ─── 404 ─────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Route introuvable', docs: '/docs' }, 404))

// ─── Erreur globale ──────────────────────────────────────────
app.onError((err, c) => {
  console.error('[api-ursule]', err)
  return c.json({ error: 'Erreur interne du serveur' }, 500)
})

export default app

// Pour Vercel Edge Runtime
export const config = { runtime: 'edge' }
```

**Test immédiat :**
```bash
npm run dev
# Ouvrir http://localhost:3000       → infos de l'API
# Ouvrir http://localhost:3000/docs  → documentation Scalar (belle UI)
# Ouvrir http://localhost:3000/health → { status: "ok" }
```

✅ **Validation étape 2 :**
- `http://localhost:3000/docs` → Page Scalar s'affiche avec le logo UrsUle
- `http://localhost:3000/health` → `{ "status": "ok" }`
- `http://localhost:3000/openapi.json` → JSON valide

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 3 — CLIENT SUPABASE + MIDDLEWARE AUTH
## ═══════════════════════════════════════════

**Crée `src/supabase.ts` :**

```typescript
// src/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client admin (service_role) pour les opérations serveur
export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Créer un client authentifié avec le token JWT de l'utilisateur
// → Respecte le RLS Supabase
export function supabaseForUser(jwt: string) {
  return createClient(url, process.env.SUPABASE_ANON_KEY ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
}
```

**Crée `src/middleware/auth.middleware.ts` :**

```typescript
// src/middleware/auth.middleware.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { supabaseAdmin } from '../supabase.js'

// Type custom pour le contexte Hono avec user
declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    userEmail: string
    jwt: string
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Token manquant. Header requis : Authorization: Bearer <token>',
    })
  }

  const token = authHeader.slice(7)

  // Vérifier le token avec Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw new HTTPException(401, {
      message: 'Token invalide ou expiré. Reconnectez-vous via POST /v1/auth/login',
    })
  }

  // Injecter l'utilisateur dans le contexte
  c.set('userId', user.id)
  c.set('userEmail', user.email ?? '')
  c.set('jwt', token)

  await next()
})

// Réponse d'erreur standardisée
export function errorResponse(c: any, status: number, message: string, details?: unknown) {
  return c.json({
    error: true,
    message,
    details: details ?? null,
    timestamp: new Date().toISOString(),
    docs: '/docs',
  }, status)
}

// Réponse de succès standardisée
export function successResponse(c: any, data: unknown, message?: string, status = 200) {
  return c.json({
    success: true,
    message: message ?? 'Succès',
    data,
    timestamp: new Date().toISOString(),
  }, status)
}
```

**Crée `src/middleware/rateLimit.middleware.ts` :**

```typescript
// src/middleware/rateLimit.middleware.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

// Rate limit simple en mémoire (pour Vercel Edge, utiliser KV en production)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimitMiddleware(maxRequests = 100, windowMs = 60 * 1000) {
  return createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for') ?? 'unknown'
    const now = Date.now()
    const record = requestCounts.get(ip)

    if (!record || now > record.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs })
    } else if (record.count >= maxRequests) {
      throw new HTTPException(429, {
        message: `Trop de requêtes. Limite : ${maxRequests} requêtes / ${windowMs / 1000}s`,
      })
    } else {
      record.count++
    }

    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(maxRequests - (requestCounts.get(ip)?.count ?? 0)))
    await next()
  })
}
```

✅ **Validation étape 3 :**
```bash
# Tester sans token
curl http://localhost:3000/v1/tasks
# → 401 { "message": "Token manquant..." }
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 4 — ROUTE AUTH
## ═══════════════════════════════════════════

**Crée `src/routes/auth.routes.ts` :**

```typescript
// src/routes/auth.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabaseAdmin } from '../supabase.js'
import { successResponse, errorResponse } from '../middleware/auth.middleware.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const auth = new Hono()

// ─── POST /auth/login ─────────────────────────────────────────
auth.post('/login',
  zValidator('json', z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
  })),
  async (c) => {
    const { email, password } = c.req.valid('json')

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email, password,
    })

    if (error) {
      return errorResponse(c, 401, 'Email ou mot de passe incorrect')
    }

    return successResponse(c, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    }, 'Connexion réussie')
  }
)

// ─── POST /auth/refresh ───────────────────────────────────────
auth.post('/refresh',
  zValidator('json', z.object({
    refresh_token: z.string(),
  })),
  async (c) => {
    const { refresh_token } = c.req.valid('json')
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token })
    if (error) return errorResponse(c, 401, 'Token de rafraîchissement invalide')
    return successResponse(c, {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token,
      expires_in: data.session!.expires_in,
    }, 'Token rafraîchi')
  }
)

// ─── GET /auth/me ─────────────────────────────────────────────
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, avatar_url, timezone, created_at')
    .eq('id', userId)
    .single()
  if (error) return errorResponse(c, 404, 'Profil introuvable')
  return successResponse(c, data, 'Profil récupéré')
})

// ─── POST /auth/logout ────────────────────────────────────────
auth.post('/logout', authMiddleware, async (c) => {
  await supabaseAdmin.auth.signOut()
  return successResponse(c, null, 'Déconnexion réussie')
})

export default auth
```

**Intègre dans `src/index.ts` :**
```typescript
import authRoutes from './routes/auth.routes.js'
const v1 = new Hono().basePath('/v1')
v1.route('/auth', authRoutes)
app.route('/', v1)
```

✅ **Validation étape 4 :**
```bash
# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"krsidoine7@gmail.com","password":"ton_mot_de_passe"}'

# → { "success": true, "data": { "access_token": "eyJhbGci...", ... } }
# Copie le access_token pour les étapes suivantes !
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 5 — ROUTES TÂCHES (CRUD COMPLET)
## ═══════════════════════════════════════════

**Crée `src/schemas/task.schema.ts` :**

```typescript
// src/schemas/task.schema.ts
import { z } from 'zod'

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done', 'archived', 'rescheduled', 'to_redo'])
export const TaskPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent'])

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(255),
  description: z.string().max(50000).optional(),
  status: TaskStatusEnum.default('todo'),
  priority: TaskPriorityEnum.default('normal'),
  category_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  deadline: z.string().datetime({ message: 'Format ISO 8601 requis' }).optional(),
  estimated_duration_minutes: z.number().int().min(1).max(10080).optional(),
  is_pinned: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(20).default([]),
  validation_type: z.enum(['calc', 'question', 'none']).default('calc'),
  validation_question: z.string().optional(),
  recurrence_type: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']).optional(),
  webhook_url: z.string().url().optional(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial()

export const TaskQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  category_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  is_pinned: z.string().transform(v => v === 'true').optional(),
  search: z.string().max(100).optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
  sort_by: z.enum(['created_at', 'deadline', 'priority', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})
```

**Crée `src/routes/tasks.routes.ts` :**

```typescript
// src/routes/tasks.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabaseAdmin } from '../supabase.js'
import { authMiddleware, successResponse, errorResponse } from '../middleware/auth.middleware.js'
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '../schemas/task.schema.js'

const tasks = new Hono()

// Toutes les routes tâches nécessitent l'auth
tasks.use('*', authMiddleware)

// ─── GET /tasks ───────────────────────────────────────────────
tasks.get('/', zValidator('query', TaskQuerySchema), async (c) => {
  const userId = c.get('userId')
  const q = c.req.valid('query')

  let query = supabaseAdmin
    .from('tasks')
    .select(`
      id, title, status, priority, deadline, is_pinned, tags,
      appreciation, completed_at, estimated_duration_minutes, actual_duration_minutes,
      created_at, updated_at,
      category:categories(id, name, color, icon),
      project:projects(id, name, color)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('parent_task_id', null)
    .order(q.sort_by, { ascending: q.sort_order === 'asc' })
    .range(q.offset, q.offset + q.limit - 1)

  if (q.status)      query = query.eq('status', q.status)
  if (q.priority)    query = query.eq('priority', q.priority)
  if (q.category_id) query = query.eq('category_id', q.category_id)
  if (q.project_id)  query = query.eq('project_id', q.project_id)
  if (q.is_pinned !== undefined) query = query.eq('is_pinned', q.is_pinned)
  if (q.search)      query = query.ilike('title', `%${q.search}%`)

  const { data, error, count } = await query
  if (error) return errorResponse(c, 500, error.message)

  return successResponse(c, {
    tasks: data,
    pagination: {
      total: count ?? 0,
      limit: q.limit,
      offset: q.offset,
      has_more: (q.offset + q.limit) < (count ?? 0),
    },
  })
})

// ─── POST /tasks ──────────────────────────────────────────────
tasks.post('/', zValidator('json', CreateTaskSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({ ...body, user_id: userId })
    .select(`*, category:categories(id,name,color), project:projects(id,name,color)`)
    .single()

  if (error) return errorResponse(c, 400, error.message)
  return successResponse(c, data, `Tâche "${data.title}" créée`, 201)
})

// ─── GET /tasks/:id ───────────────────────────────────────────
tasks.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select(`
      *,
      category:categories(id, name, color, icon),
      project:projects(id, name, color, status),
      subtasks:tasks!parent_task_id(id, title, status, deadline, priority),
      comments:task_comments(id, content, created_at, user_id),
      images:task_images(id, storage_path, filename, mime_type)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (error) return errorResponse(c, 404, 'Tâche introuvable')
  return successResponse(c, data)
})

// ─── PUT /tasks/:id ───────────────────────────────────────────
tasks.put('/:id', zValidator('json', UpdateTaskSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return errorResponse(c, 404, 'Tâche introuvable ou accès refusé')
  return successResponse(c, data, `Tâche "${data.title}" mise à jour`)
})

// ─── DELETE /tasks/:id ────────────────────────────────────────
tasks.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const { data: task } = await supabaseAdmin
    .from('tasks').select('title').eq('id', id).eq('user_id', userId).single()

  const { error } = await supabaseAdmin
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return errorResponse(c, 404, 'Tâche introuvable')
  return successResponse(c, null, `Tâche "${task?.title}" supprimée`)
})

// ─── POST /tasks/:id/complete ─────────────────────────────────
tasks.post('/:id/complete',
  zValidator('json', z.object({
    appreciation: z.enum(['happy','too_hard','boring','nothing_learned','super_productive','stressful','enriching','neutral']).optional(),
  })),
  async (c) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const { appreciation } = c.req.valid('json')

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        appreciation: appreciation ?? 'neutral',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return errorResponse(c, 404, 'Tâche introuvable')
    return successResponse(c, data, `✅ Tâche "${data.title}" complétée !`)
  }
)

// ─── POST /tasks/:id/comments ─────────────────────────────────
tasks.post('/:id/comments',
  zValidator('json', z.object({ content: z.string().min(1).max(5000) })),
  async (c) => {
    const userId = c.get('userId')
    const taskId = c.req.param('id')
    const { content } = c.req.valid('json')

    const { data, error } = await supabaseAdmin
      .from('task_comments')
      .insert({ task_id: taskId, user_id: userId, content })
      .select()
      .single()

    if (error) return errorResponse(c, 400, error.message)
    return successResponse(c, data, 'Commentaire ajouté', 201)
  }
)

export default tasks
```

**Intègre dans `src/index.ts` :**
```typescript
import taskRoutes from './routes/tasks.routes.js'
v1.route('/tasks', taskRoutes)
```

✅ **Validation étape 5 :**
```bash
TOKEN="ton_access_token_de_letape_4"

# Lister les tâches
curl http://localhost:3000/v1/tasks \
  -H "Authorization: Bearer $TOKEN"

# Créer une tâche
curl -X POST http://localhost:3000/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tester l API UrsUle","priority":"high","deadline":"2025-12-31T18:00:00Z"}'

# Filtrer les tâches urgentes
curl "http://localhost:3000/v1/tasks?priority=urgent&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# → Dans /docs Scalar, tester le bouton "Try it" sur chaque route
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 6 — ROUTES PROJETS & CATÉGORIES
## ═══════════════════════════════════════════

**Crée `src/routes/projects.routes.ts` :**

```typescript
// src/routes/projects.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabaseAdmin } from '../supabase.js'
import { authMiddleware, successResponse, errorResponse } from '../middleware/auth.middleware.js'

const projects = new Hono()
projects.use('*', authMiddleware)

const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981'),
  icon: z.string().default('folder-open'),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
  deadline: z.string().datetime().optional(),
  budget: z.number().min(0).optional(),
  notes: z.string().optional(),
})

// GET /projects
projects.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status')

  let query = supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: projs, error } = await query
  if (error) return errorResponse(c, 500, error.message)

  // Calcul progression
  const withProgress = await Promise.all(projs.map(async (p) => {
    const [{ count: total }, { count: done }] = await Promise.all([
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
        .eq('project_id', p.id).is('deleted_at', null),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
        .eq('project_id', p.id).eq('status', 'done').is('deleted_at', null),
    ])
    return { ...p, task_count: total ?? 0, completed_count: done ?? 0,
      progress_percent: total ? Math.round(((done ?? 0) / total) * 100) : 0 }
  }))

  return successResponse(c, { projects: withProgress })
})

// POST /projects
projects.post('/', zValidator('json', ProjectSchema), async (c) => {
  const userId = c.get('userId')
  const body = c.req.valid('json')
  const { data, error } = await supabaseAdmin
    .from('projects').insert({ ...body, user_id: userId }).select().single()
  if (error) return errorResponse(c, 400, error.message)
  return successResponse(c, data, `Projet "${data.name}" créé`, 201)
})

// GET /projects/:id
projects.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select(`*, tasks(id, title, status, priority, deadline)`)
    .eq('id', id).eq('user_id', userId).single()
  if (error) return errorResponse(c, 404, 'Projet introuvable')
  return successResponse(c, data)
})

// PUT /projects/:id
projects.put('/:id', zValidator('json', ProjectSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = c.req.valid('json')
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', userId).select().single()
  if (error) return errorResponse(c, 404, 'Projet introuvable')
  return successResponse(c, data, `Projet "${data.name}" mis à jour`)
})

// DELETE /projects/:id
projects.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { error } = await supabaseAdmin
    .from('projects').update({ status: 'archived' }).eq('id', id).eq('user_id', userId)
  if (error) return errorResponse(c, 404, 'Projet introuvable')
  return successResponse(c, null, 'Projet archivé')
})

export default projects
```

**Crée `src/routes/categories.routes.ts` :**

```typescript
// src/routes/categories.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabaseAdmin } from '../supabase.js'
import { authMiddleware, successResponse, errorResponse } from '../middleware/auth.middleware.js'

const categories = new Hono()
categories.use('*', authMiddleware)

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().default('folder'),
})

categories.get('/', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('categories').select('*').eq('user_id', c.get('userId')).order('sort_order')
  if (error) return errorResponse(c, 500, error.message)
  return successResponse(c, { categories: data })
})

categories.post('/', zValidator('json', CategorySchema), async (c) => {
  const body = c.req.valid('json')
  const { data, error } = await supabaseAdmin
    .from('categories').insert({ ...body, user_id: c.get('userId') }).select().single()
  if (error) return errorResponse(c, 400, error.message)
  return successResponse(c, data, `Catégorie "${data.name}" créée`, 201)
})

categories.put('/:id', zValidator('json', CategorySchema.partial()), async (c) => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .update(c.req.valid('json'))
    .eq('id', c.req.param('id')).eq('user_id', c.get('userId')).eq('is_system', false)
    .select().single()
  if (error) return errorResponse(c, 400, 'Catégorie introuvable ou système (non modifiable)')
  return successResponse(c, data, 'Catégorie mise à jour')
})

categories.delete('/:id', async (c) => {
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', c.req.param('id')).eq('user_id', c.get('userId')).eq('is_system', false)
  if (error) return errorResponse(c, 400, 'Impossible de supprimer (catégorie système ou tâches liées)')
  return successResponse(c, null, 'Catégorie supprimée')
})

export default categories
```

✅ **Validation étape 6 :**
```bash
# Lister les catégories
curl http://localhost:3000/v1/categories -H "Authorization: Bearer $TOKEN"

# Créer un projet
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mon Super Projet","color":"#2563EB"}'
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 7 — ROUTE STATS & DASHBOARD
## ═══════════════════════════════════════════

**Crée `src/routes/stats.routes.ts` :**

```typescript
// src/routes/stats.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabaseAdmin } from '../supabase.js'
import { authMiddleware, successResponse, errorResponse } from '../middleware/auth.middleware.js'

const stats = new Hono()
stats.use('*', authMiddleware)

const PeriodSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'custom']).default('week'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

// GET /stats
stats.get('/', zValidator('query', PeriodSchema), async (c) => {
  const userId = c.get('userId')
  const { period, from, to } = c.req.valid('query')
  const now = new Date()
  let dateFrom: Date, dateTo: Date

  if (period === 'today') { dateFrom = new Date(now.setHours(0,0,0,0)); dateTo = new Date() }
  else if (period === 'week') { dateFrom = new Date(Date.now() - 7*24*60*60*1000); dateTo = new Date() }
  else if (period === 'month') { dateFrom = new Date(now.getFullYear(), now.getMonth(), 1); dateTo = new Date() }
  else { dateFrom = new Date(from!); dateTo = new Date(to!) }

  const fromISO = dateFrom.toISOString()
  const toISO = dateTo.toISOString()

  const [created, completed, overdue, priorities, moods, dailyData] = await Promise.all([
    supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).is('deleted_at', null).gte('created_at', fromISO).lte('created_at', toISO),
    supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'done').gte('completed_at', fromISO).lte('completed_at', toISO),
    supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).neq('status', 'done').is('deleted_at', null).lt('deadline', toISO),
    supabaseAdmin.from('tasks').select('priority')
      .eq('user_id', userId).is('deleted_at', null).neq('status', 'done'),
    supabaseAdmin.from('tasks').select('appreciation')
      .eq('user_id', userId).eq('status', 'done').gte('completed_at', fromISO).not('appreciation', 'is', null),
    supabaseAdmin.from('tasks').select('completed_at')
      .eq('user_id', userId).eq('status', 'done').gte('completed_at', fromISO).lte('completed_at', toISO),
  ])

  const total = created.count ?? 0
  const done = completed.count ?? 0
  const rate = total > 0 ? Math.round((done / total) * 100) : 0

  // Agréger priorités
  const byPriority: Record<string, number> = {}
  priorities.data?.forEach(t => { byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1 })

  // Agréger humeurs
  const byMood: Record<string, number> = {}
  moods.data?.forEach(t => { if (t.appreciation) byMood[t.appreciation] = (byMood[t.appreciation] ?? 0) + 1 })

  // Données journalières
  const byDay: Record<string, number> = {}
  dailyData.data?.forEach(t => {
    const day = new Date(t.completed_at).toISOString().split('T')[0]
    byDay[day] = (byDay[day] ?? 0) + 1
  })

  return successResponse(c, {
    period, date_range: { from: fromISO, to: toISO },
    summary: { total_created: total, total_completed: done, total_overdue: overdue.count ?? 0, completion_rate: rate },
    by_priority: byPriority,
    by_mood: byMood,
    by_day: byDay,
  })
})

// GET /stats/dashboard — Vue rapide pour le widget dashboard
stats.get('/dashboard', async (c) => {
  const userId = c.get('userId')
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)

  const [todayTasks, urgentTasks, overdueTasks, activeCount] = await Promise.all([
    supabaseAdmin.from('tasks').select('id, title, status, priority, deadline')
      .eq('user_id', userId).is('deleted_at', null).neq('status', 'done')
      .gte('deadline', todayStart.toISOString()).lte('deadline', new Date(todayStart.getTime() + 86400000).toISOString()),
    supabaseAdmin.from('tasks').select('id, title, deadline').eq('user_id', userId)
      .eq('priority', 'urgent').neq('status', 'done').is('deleted_at', null).limit(5),
    supabaseAdmin.from('tasks').select('id, title, deadline').eq('user_id', userId)
      .neq('status', 'done').is('deleted_at', null).lt('deadline', new Date().toISOString()).limit(5),
    supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).in('status', ['todo', 'in_progress']).is('deleted_at', null),
  ])

  return successResponse(c, {
    today_tasks: todayTasks.data,
    urgent_tasks: urgentTasks.data,
    overdue_tasks: overdueTasks.data,
    active_task_count: activeCount.count ?? 0,
    generated_at: new Date().toISOString(),
  })
})

export default stats
```

**Intègre tout dans `src/index.ts` :**
```typescript
import projectRoutes from './routes/projects.routes.js'
import categoryRoutes from './routes/categories.routes.js'
import statsRoutes from './routes/stats.routes.js'

v1.route('/projects', projectRoutes)
v1.route('/categories', categoryRoutes)
v1.route('/stats', statsRoutes)
v1.route('/dashboard', statsRoutes) // Alias pour /stats/dashboard
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 8 — LE SDK CLIENT (1 LIGNE)
## ═══════════════════════════════════════════

**Crée le dossier SDK :**
```bash
mkdir -p sdk/src && cd sdk
npm init -y
npm install -D typescript
```

**Crée `sdk/src/client.ts` :**

```typescript
// sdk/src/client.ts — Classe principale du SDK

export interface UrsUleConfig {
  apiKey: string          // Bearer token JWT
  baseUrl?: string        // Défaut : https://api-ursule.vercel.app
  version?: string        // Défaut : v1
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export class UrsUleClient {
  private apiKey: string
  private baseUrl: string
  private version: string

  constructor(config: UrsUleConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = (config.baseUrl ?? 'https://api-ursule.vercel.app').replace(/\/$/, '')
    this.version = config.version ?? 'v1'
  }

  // ─── Requête HTTP interne ──────────────────────────────────
  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = options

    let url = `${this.baseUrl}/${this.version}${endpoint}`
    if (query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined) params.append(k, String(v))
      })
      if (params.toString()) url += `?${params.toString()}`
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const json = await res.json() as { success: boolean; data: T; message: string; error?: string }

    if (!res.ok) {
      throw new UrsUleError(json.error ?? json.message ?? 'Erreur API', res.status)
    }

    return json.data
  }

  // ─── Namespace : Tasks ────────────────────────────────────
  get tasks() {
    return {
      list: (filters?: TaskListFilters) =>
        this.request<TaskListResponse>('/tasks', { query: filters as any }),

      get: (id: string) =>
        this.request<Task>(`/tasks/${id}`),

      create: (data: CreateTaskInput) =>
        this.request<Task>('/tasks', { method: 'POST', body: data }),

      update: (id: string, data: Partial<CreateTaskInput>) =>
        this.request<Task>(`/tasks/${id}`, { method: 'PUT', body: data }),

      delete: (id: string) =>
        this.request<null>(`/tasks/${id}`, { method: 'DELETE' }),

      complete: (id: string, appreciation?: AppreciationType) =>
        this.request<Task>(`/tasks/${id}/complete`, { method: 'POST', body: { appreciation } }),

      addComment: (id: string, content: string) =>
        this.request<TaskComment>(`/tasks/${id}/comments`, { method: 'POST', body: { content } }),
    }
  }

  // ─── Namespace : Projects ─────────────────────────────────
  get projects() {
    return {
      list: (filters?: { status?: string }) =>
        this.request<ProjectListResponse>('/projects', { query: filters as any }),

      get: (id: string) =>
        this.request<Project>(`/projects/${id}`),

      create: (data: CreateProjectInput) =>
        this.request<Project>('/projects', { method: 'POST', body: data }),

      update: (id: string, data: Partial<CreateProjectInput>) =>
        this.request<Project>(`/projects/${id}`, { method: 'PUT', body: data }),

      delete: (id: string) =>
        this.request<null>(`/projects/${id}`, { method: 'DELETE' }),
    }
  }

  // ─── Namespace : Categories ───────────────────────────────
  get categories() {
    return {
      list: () => this.request<CategoryListResponse>('/categories'),
      create: (data: { name: string; color?: string; icon?: string }) =>
        this.request<Category>('/categories', { method: 'POST', body: data }),
      delete: (id: string) =>
        this.request<null>(`/categories/${id}`, { method: 'DELETE' }),
    }
  }

  // ─── Namespace : Stats ────────────────────────────────────
  get stats() {
    return {
      get: (filters?: StatsFilters) =>
        this.request<StatsResponse>('/stats', { query: filters as any }),

      dashboard: () =>
        this.request<DashboardResponse>('/stats/dashboard'),
    }
  }

  // ─── Auth helpers ─────────────────────────────────────────
  updateApiKey(newKey: string) {
    this.apiKey = newKey
  }
}

// Erreur custom
export class UrsUleError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'UrsUleError'
    this.status = status
  }
}
```

**Crée `sdk/src/index.ts` (types + exports) :**

```typescript
// sdk/src/index.ts
export { UrsUleClient, UrsUleError } from './client.js'
export type { UrsUleConfig }  from './client.js'

// Types publics
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived' | 'rescheduled' | 'to_redo'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type AppreciationType = 'happy' | 'too_hard' | 'boring' | 'nothing_learned' | 'super_productive' | 'stressful' | 'enriching' | 'neutral'

export interface Task {
  id: string; title: string; description?: string; status: TaskStatus; priority: TaskPriority
  deadline?: string; estimated_duration_minutes?: number; actual_duration_minutes: number
  is_pinned: boolean; tags: string[]; appreciation?: AppreciationType
  category?: { id: string; name: string; color: string }
  project?: { id: string; name: string; color: string }
  created_at: string; updated_at: string
}

export interface CreateTaskInput {
  title: string; description?: string; status?: TaskStatus; priority?: TaskPriority
  category_id?: string; project_id?: string; deadline?: string
  estimated_duration_minutes?: number; is_pinned?: boolean; tags?: string[]
  validation_type?: 'calc' | 'question' | 'none'
}

export interface TaskListFilters {
  status?: TaskStatus; priority?: TaskPriority; category_id?: string
  project_id?: string; search?: string; limit?: number; offset?: number
  sort_by?: 'created_at' | 'deadline' | 'priority' | 'title'
  sort_order?: 'asc' | 'desc'; is_pinned?: boolean
}

export interface TaskListResponse {
  tasks: Task[]
  pagination: { total: number; limit: number; offset: number; has_more: boolean }
}

export interface Project {
  id: string; name: string; description?: string; color: string
  status: 'active' | 'paused' | 'completed' | 'archived'; deadline?: string
  budget?: number; budget_currency: string; progress_percent?: number
  task_count?: number; completed_count?: number; created_at: string
}

export interface CreateProjectInput {
  name: string; description?: string; color?: string; status?: string; deadline?: string; budget?: number
}

export interface ProjectListResponse { projects: Project[] }

export interface Category { id: string; name: string; color: string; icon: string; is_system: boolean }
export interface CategoryListResponse { categories: Category[] }

export interface StatsFilters { period?: 'today' | 'week' | 'month' | 'custom'; from?: string; to?: string }
export interface StatsResponse {
  period: string; date_range: { from: string; to: string }
  summary: { total_created: number; total_completed: number; total_overdue: number; completion_rate: number }
  by_priority: Record<string, number>; by_mood: Record<string, number>; by_day: Record<string, number>
}

export interface DashboardResponse {
  today_tasks: Task[]; urgent_tasks: Task[]; overdue_tasks: Task[]
  active_task_count: number; generated_at: string
}

export interface TaskComment { id: string; content: string; created_at: string }
```

✅ **Validation étape 8 :**

```typescript
// Dans n'importe quel projet, tester le SDK :
import { UrsUleClient } from './sdk/src/index.js'  // ou '@ursule/sdk' après publication

const ursule = new UrsUleClient({ apiKey: 'ton_jwt_token' })

// ─── 1 LIGNE pour tout faire ─────────────────────────────
const { tasks } = await ursule.tasks.list({ priority: 'urgent' })
const task      = await ursule.tasks.create({ title: 'Test SDK', priority: 'high' })
const updated   = await ursule.tasks.update(task.id, { status: 'in_progress' })
await            ursule.tasks.complete(task.id, 'super_productive')
const { projects } = await ursule.projects.list({ status: 'active' })
const stats     = await ursule.stats.get({ period: 'week' })
const dash      = await ursule.stats.dashboard()
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 9 — DÉPLOIEMENT SUR VERCEL
## ═══════════════════════════════════════════

```bash
# 1. Dans api-ursule/ — déployer
npx vercel --prod

# 2. Ajouter dans Vercel Dashboard → Environment Variables :
# SUPABASE_URL              → ton URL Supabase
# SUPABASE_SERVICE_ROLE_KEY → ta clé service_role
# SUPABASE_ANON_KEY         → ta clé anon publique
# SUPABASE_JWT_SECRET       → ton JWT secret
# CORS_ORIGINS              → https://ursule.vercel.app,https://ton-autre-projet.vercel.app

# 3. Après déploiement, tester :
curl https://api-ursule.vercel.app/health
curl https://api-ursule.vercel.app/docs  # → Scalar en production !
```

**Mettre à jour le SDK pour pointer vers la prod :**
```typescript
const ursule = new UrsUleClient({
  apiKey: 'ton_token',
  baseUrl: 'https://api-ursule.vercel.app',  // URL de prod
})
```

**Dans l'app UrsUle (Vue 3), remplacer les appels Supabase directs par le SDK :**
```typescript
// Avant (appel Supabase direct) :
const { data } = await supabase.from('tasks').select('*')...

// Après (via l'API — plus sécurisé, centralise la logique) :
const { tasks } = await ursule.tasks.list()
```

✅ **Validation étape 9 :**
```bash
# L'URL de prod est accessible
curl https://api-ursule.vercel.app/health
# → { "status": "ok", "service": "api-ursule" }

# La doc Scalar est disponible en prod
# Ouvrir : https://api-ursule.vercel.app/docs
```

---

## ═══════════════════════════════════════════
## 🟦 ÉTAPE 10 — CONNECTER TES AUTRES PROJETS
## ═══════════════════════════════════════════

**Dans n'importe quel autre projet (Vue, React, Node, Python...) :**

### Option A — SDK TypeScript/JavaScript
```typescript
// npm install (localement depuis le dossier sdk, ou via npm link)
import { UrsUleClient } from '@ursule/sdk'

const ursule = new UrsUleClient({
  apiKey: process.env.URSULE_API_TOKEN!,
  baseUrl: 'https://api-ursule.vercel.app',
})

// Tout est disponible en 1 ligne :
const { tasks } = await ursule.tasks.list({ status: 'todo', limit: 10 })
await ursule.tasks.create({ title: 'Nouvelle tâche', priority: 'urgent' })
```

### Option B — fetch brut (n'importe quel langage)
```bash
# Bash / n8n / Make / Zapier
curl -X POST https://api-ursule.vercel.app/v1/tasks \
  -H "Authorization: Bearer $URSULE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tâche depuis Make","priority":"high"}'
```

### Option C — Python (ton app de facturation)
```python
import requests

URSULE_TOKEN = "ton_jwt_token"
BASE_URL = "https://api-ursule.vercel.app/v1"
HEADERS = {"Authorization": f"Bearer {URSULE_TOKEN}", "Content-Type": "application/json"}

# Créer une tâche
r = requests.post(f"{BASE_URL}/tasks",
    headers=HEADERS,
    json={"title": "Facture client à envoyer", "priority": "urgent"}
)
task = r.json()["data"]
print(f"Tâche créée: {task['id']}")

# Lister les projets actifs
r = requests.get(f"{BASE_URL}/projects?status=active", headers=HEADERS)
projects = r.json()["data"]["projects"]
```

### Option C — Publier le SDK sur npm (pour partager entre tes projets)
```bash
cd sdk/
# Dans package.json : "name": "@krsidoine/ursule-sdk" (ton scope npm)
npm login
npm publish --access public

# Dans tes autres projets :
npm install @krsidoine/ursule-sdk
```

---

## 📋 CHECKLIST FINALE

| Étape | Tâche | Validé |
|---|---|---|
| 0 | Comprendre Hono + Scalar + SDK | ⬜ |
| 1 | Projet initialisé, dépendances installées | ⬜ |
| 2 | Serveur Hono + page Scalar `/docs` visible | ⬜ |
| 3 | Middleware auth JWT + rate limit | ⬜ |
| 4 | `POST /auth/login` retourne un token | ⬜ |
| 5 | CRUD `/tasks` complet (7 routes) | ⬜ |
| 6 | Routes `/projects` + `/categories` | ⬜ |
| 7 | Routes `/stats` + `/stats/dashboard` | ⬜ |
| 8 | SDK client — 1 ligne par opération | ⬜ |
| 9 | Déployé sur Vercel, `/docs` accessible en prod | ⬜ |
| 10 | Autre projet connecté via SDK | ⬜ |

---

## 🔗 TABLEAU : MES PROJETS CONNECTÉS À URSULE

| Projet | Connexion | Ce qu'il fait |
|---|---|---|
| **App UrsUle** (Vue 3) | SDK + `baseUrl: prod` | Interface principale |
| **mcp-UrsUle** | Appelle l'API en interne | Claude accède aux tâches |
| **App Facturation** | SDK Python ou fetch | Crée des tâches paiement |
| **App Vidéo-Coding** | SDK JS | Crée des tâches d'apprentissage |
| **n8n / Make** | HTTP Request node | Automatisations |
| **Mobile (futur)** | SDK ou fetch | App mobile UrsUle |

---

## 📚 LIENS UTILES

- Scalar : https://scalar.com
- Hono.js : https://hono.dev
- OpenAPI 3.1 : https://spec.openapis.org/oas/v3.1.0
- Vercel Edge Functions : https://vercel.com/docs/functions/edge-functions

---
*API UrsUle v1.0.0 — L'interface universelle entre tous tes projets*
