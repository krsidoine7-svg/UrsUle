# 🔧 TDD — UrsUle : Document de Conception Technique
**Version:** 1.0.0  
**Stack:** Vue 3 + Vite + Supabase + PostgreSQL + Vercel

---

## 1. ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                    │
│  Vue 3 (Composition API) + Vite + TypeScript            │
│  ├── shadcn-vue  (composants UI)                        │
│  ├── Tailwind CSS (styling)                             │
│  ├── Lucide Vue  (icônes)                               │
│  ├── Tiptap      (éditeur riche)                        │
│  ├── Chart.js    (graphiques)                           │
│  ├── FullCalendar (vue calendrier)                      │
│  └── VueDraggable (DnD Kanban)                         │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS / REST / Realtime WS
┌─────────────────────▼───────────────────────────────────┐
│                  SUPABASE (Backend as a Service)         │
│  ├── Auth        (JWT, email/password, OAuth)           │
│  ├── PostgreSQL  (données principales)                  │
│  ├── Storage     (images, exports)                      │
│  ├── Realtime    (sync multi-utilisateurs)              │
│  ├── Edge Functions (webhooks, logique métier)          │
│  └── Row Level Security (RLS)                           │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              SERVICES EXTERNES                           │
│  ├── Google OAuth (Drive sync)                          │
│  ├── Webhooks → Make / Zapier / n8n                     │
│  └── Browser Push Notifications                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. STACK TECHNOLOGIQUE DÉTAILLÉ

### 2.1 Frontend
```json
{
  "framework": "Vue 3.4+ (Composition API, <script setup>)",
  "bundler": "Vite 5+",
  "language": "TypeScript 5+",
  "routing": "Vue Router 4",
  "state": "Pinia 2",
  "ui": "shadcn-vue (port officiel shadcn pour Vue)",
  "css": "Tailwind CSS 3.4",
  "icons": "lucide-vue-next",
  "editor": "Tiptap 2 (extension StarterKit + Markdown)",
  "charts": "Chart.js 4 + vue-chartjs",
  "calendar": "@fullcalendar/vue3",
  "dnd": "vue-draggable-plus",
  "dates": "date-fns (locale fr-CI)",
  "forms": "vee-validate + zod",
  "http": "@supabase/supabase-js",
  "pdf": "jsPDF + html2canvas",
  "excel": "xlsx (SheetJS)",
  "markdown": "marked + DOMPurify"
}
```

### 2.2 Backend (Supabase)
```json
{
  "database": "PostgreSQL 15",
  "auth": "Supabase Auth (GoTrue)",
  "storage": "Supabase Storage (S3-compatible)",
  "realtime": "Supabase Realtime (Phoenix Channels)",
  "functions": "Supabase Edge Functions (Deno)",
  "security": "Row Level Security (RLS) + Policies"
}
```

### 2.3 DevOps
```json
{
  "hosting": "Vercel (Preview + Production)",
  "ci_cd": "GitHub Actions",
  "env": ".env.local (Vite) + Vercel Env Vars",
  "monitoring": "Vercel Analytics",
  "error_tracking": "Console errors (MVP)"
}
```

---

## 3. STRUCTURE DU PROJET

```
ursule/
├── src/
│   ├── assets/                    # Images, fonts statiques
│   │   ├── fonts/
│   │   └── images/
│   ├── components/                # Composants réutilisables
│   │   ├── ui/                    # shadcn-vue components (auto-générés)
│   │   ├── common/                # Composants partagés custom
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   ├── AppModal.vue
│   │   │   ├── RichTextEditor.vue
│   │   │   ├── FileUpload.vue
│   │   │   ├── TimerWidget.vue
│   │   │   ├── CategoryBadge.vue
│   │   │   └── PriorityBadge.vue
│   │   ├── tasks/
│   │   │   ├── TaskCard.vue
│   │   │   ├── TaskForm.vue        # Formulaire création/édition
│   │   │   ├── TaskDetail.vue      # Vue détail slide-over
│   │   │   ├── TaskList.vue        # Vue tableau
│   │   │   ├── TaskGrid.vue        # Vue grille
│   │   │   ├── TaskKanban.vue      # Vue Kanban
│   │   │   ├── SubTaskList.vue
│   │   │   ├── ValidationModal.vue # Quiz de validation
│   │   │   └── AppreciationModal.vue
│   │   ├── projects/
│   │   │   ├── ProjectCard.vue
│   │   │   ├── ProjectForm.vue
│   │   │   └── ProjectTimeline.vue
│   │   ├── stats/
│   │   │   ├── StatsOverview.vue
│   │   │   ├── CompletionChart.vue
│   │   │   ├── MoodChart.vue
│   │   │   ├── CategoryChart.vue
│   │   │   └── HeatmapCalendar.vue
│   │   └── calendar/
│   │       └── CalendarView.vue
│   ├── views/                     # Pages (routes)
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   └── ForgotPasswordView.vue
│   │   ├── DashboardView.vue
│   │   ├── TasksView.vue
│   │   ├── ProjectsView.vue
│   │   ├── ProjectDetailView.vue
│   │   ├── CalendarView.vue
│   │   ├── StatsView.vue
│   │   ├── SettingsView.vue
│   │   └── NotFoundView.vue
│   ├── stores/                    # Pinia stores
│   │   ├── auth.store.ts
│   │   ├── tasks.store.ts
│   │   ├── projects.store.ts
│   │   ├── categories.store.ts
│   │   ├── stats.store.ts
│   │   └── ui.store.ts            # Vue active, sidebar state, etc.
│   ├── composables/               # Logique réutilisable (hooks Vue)
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   ├── useProjects.ts
│   │   ├── useTimer.ts
│   │   ├── useExport.ts
│   │   ├── useWebhook.ts
│   │   └── useNotifications.ts
│   ├── services/                  # Appels API Supabase
│   │   ├── supabase.ts            # Client Supabase
│   │   ├── auth.service.ts
│   │   ├── tasks.service.ts
│   │   ├── projects.service.ts
│   │   ├── storage.service.ts
│   │   └── webhook.service.ts
│   ├── types/                     # Types TypeScript
│   │   ├── task.types.ts
│   │   ├── project.types.ts
│   │   ├── user.types.ts
│   │   └── database.types.ts      # Généré par Supabase CLI
│   ├── utils/                     # Fonctions utilitaires
│   │   ├── date.utils.ts
│   │   ├── crypto.utils.ts        # AES encryption
│   │   ├── format.utils.ts
│   │   └── validation.utils.ts
│   ├── router/
│   │   └── index.ts               # Vue Router + guards
│   ├── lib/
│   │   └── utils.ts               # cn() + helpers shadcn
│   ├── App.vue
│   └── main.ts
├── supabase/
│   ├── migrations/                # SQL migrations
│   │   ├── 001_init_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   └── functions/                 # Edge Functions
│       └── webhook-dispatcher/
│           └── index.ts
├── public/
│   ├── favicon.ico
│   └── pwa-manifest.json
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. SCHÉMA DE BASE DE DONNÉES POSTGRESQL

### 4.1 Table `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Africa/Abidjan',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: créer profil auto après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 4.2 Table `categories`
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  is_system BOOLEAN DEFAULT FALSE,  -- catégories statiques non supprimables
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catégories système insérées à la création du profil
```

### 4.3 Table `projects`
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10B981',
  icon TEXT DEFAULT 'folder-open',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  deadline TIMESTAMPTZ,
  budget DECIMAL(15,2),
  budget_currency TEXT DEFAULT 'FCFA',
  notes TEXT,  -- Markdown
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Table `tasks` (Table principale)
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,  -- pour sous-tâches
  
  -- Contenu
  title TEXT NOT NULL,
  description TEXT,               -- Markdown
  description_json JSONB,         -- Tiptap JSON format
  
  -- Statut & Priorité
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived', 'rescheduled', 'to_redo')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Temps
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER DEFAULT 0,
  
  -- Dates
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Récurrence
  recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'custom')),
  recurrence_config JSONB,        -- {days: [1,3,5], interval: 2, end_after: 10}
  recurrence_parent_id UUID REFERENCES tasks(id),
  
  -- Features
  is_pinned BOOLEAN DEFAULT FALSE,
  color TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Validation gamifiée
  validation_type TEXT DEFAULT 'calc' CHECK (validation_type IN ('calc', 'question', 'none')),
  validation_question TEXT,
  validation_answer TEXT,
  validation_attempts INTEGER DEFAULT 0,
  
  -- Post-complétion
  appreciation TEXT CHECK (appreciation IN ('happy', 'too_hard', 'boring', 'nothing_learned', 'super_productive', 'stressful', 'enriching', 'neutral')),
  
  -- Webhook
  webhook_url TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
```

### 4.5 Table `task_comments`
```sql
CREATE TABLE task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.6 Table `task_images`
```sql
CREATE TABLE task_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  storage_path TEXT NOT NULL,     -- chemin dans Supabase Storage
  filename TEXT NOT NULL,
  size_bytes INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.7 Table `time_sessions`
```sql
CREATE TABLE time_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  session_type TEXT DEFAULT 'chrono' CHECK (session_type IN ('chrono', 'timer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 Table `webhook_logs`
```sql
CREATE TABLE webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  success BOOLEAN,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. ROW LEVEL SECURITY (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- Politique universelle : un user ne voit que ses données
CREATE POLICY "Users can only access own data" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);
  
-- Les commentaires : voir si on est sur une tâche qu'on possède
CREATE POLICY "Comment access via task ownership" ON task_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.user_id = auth.uid()
    )
  );
```

---

## 6. SERVICES TYPESCRIPT

### 6.1 Client Supabase (`src/services/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

### 6.2 Service Tâches (`src/services/tasks.service.ts`)
```typescript
import { supabase } from './supabase'
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types/task.types'

export const tasksService = {
  // Récupérer toutes les tâches de l'utilisateur (non supprimées)
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon),
        project:projects(id, name, color),
        subtasks:tasks!parent_task_id(id, title, status),
        images:task_images(id, storage_path, filename)
      `)
      .is('deleted_at', null)
      .is('parent_task_id', null) // Pas de sous-tâches dans la liste principale
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.priority) query = query.eq('priority', filters.priority)
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters?.projectId) query = query.eq('project_id', filters.projectId)
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

    const { data, error } = await query
    if (error) throw error
    return data as Task[]
  },

  async getById(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(*), project:projects(*), subtasks:tasks!parent_task_id(*), comments:task_comments(*), images:task_images(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Task
  },

  async create(dto: CreateTaskDTO): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(dto)
      .select()
      .single()
    if (error) throw error
    return data as Task
  },

  async update(id: string, dto: UpdateTaskDTO): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Task
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async complete(id: string, appreciation?: string): Promise<Task> {
    return this.update(id, {
      status: 'done',
      completed_at: new Date().toISOString(),
      appreciation: appreciation ?? 'neutral'
    })
  }
}
```

### 6.3 Store Pinia Tâches (`src/stores/tasks.store.ts`)
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasksService } from '@/services/tasks.service'
import type { Task, TaskFilters } from '@/types/task.types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeFilters = ref<TaskFilters>({})

  // Computed
  const todayTasks = computed(() => {
    const today = new Date().toDateString()
    return tasks.value.filter(t => 
      t.deadline && new Date(t.deadline).toDateString() === today
    )
  })

  const urgentTasks = computed(() => 
    tasks.value.filter(t => t.priority === 'urgent' && t.status !== 'done')
  )

  const overdueTasks = computed(() => 
    tasks.value.filter(t => 
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
    )
  )

  // Actions
  async function fetchTasks(filters?: TaskFilters) {
    loading.value = true
    try {
      tasks.value = await tasksService.getAll(filters)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createTask(dto: CreateTaskDTO) {
    const task = await tasksService.create(dto)
    tasks.value.unshift(task)
    return task
  }

  async function updateTask(id: string, dto: UpdateTaskDTO) {
    const updated = await tasksService.update(id, dto)
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) tasks.value[idx] = updated
    return updated
  }

  async function deleteTask(id: string) {
    await tasksService.softDelete(id)
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  return { tasks, loading, error, todayTasks, urgentTasks, overdueTasks, fetchTasks, createTask, updateTask, deleteTask }
})
```

---

## 7. TYPES TYPESCRIPT

### `src/types/task.types.ts`
```typescript
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived' | 'rescheduled' | 'to_redo'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type AppreciationType = 'happy' | 'too_hard' | 'boring' | 'nothing_learned' | 'super_productive' | 'stressful' | 'enriching' | 'neutral'
export type ValidationType = 'calc' | 'question' | 'none'

export interface Task {
  id: string
  user_id: string
  project_id?: string
  category_id?: string
  parent_task_id?: string
  title: string
  description?: string
  description_json?: object
  status: TaskStatus
  priority: TaskPriority
  estimated_duration_minutes?: number
  actual_duration_minutes: number
  start_date?: string
  deadline?: string
  expiry_date?: string
  completed_at?: string
  recurrence_type?: RecurrenceType
  recurrence_config?: object
  is_pinned: boolean
  color?: string
  tags: string[]
  validation_type: ValidationType
  validation_question?: string
  validation_answer?: string
  validation_attempts: number
  appreciation?: AppreciationType
  webhook_url?: string
  deleted_at?: string
  created_at: string
  updated_at: string
  // Relations jointes
  category?: Category
  project?: Project
  subtasks?: Task[]
  images?: TaskImage[]
  comments?: TaskComment[]
}

export interface CreateTaskDTO {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  category_id?: string
  project_id?: string
  parent_task_id?: string
  deadline?: string
  estimated_duration_minutes?: number
  recurrence_type?: RecurrenceType
  validation_type?: ValidationType
  validation_question?: string
  validation_answer?: string
  is_pinned?: boolean
  tags?: string[]
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  actual_duration_minutes?: number
  completed_at?: string
  appreciation?: AppreciationType
  validation_attempts?: number
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  categoryId?: string
  projectId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  isPinned?: boolean
}
```

---

## 8. ROUTING (`src/router/index.ts`)

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Auth
    { path: '/login', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true } },
    { path: '/register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },
    { path: '/forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { guest: true } },
    
    // App (protégées)
    {
      path: '/',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects/:id',
      component: () => import('@/views/ProjectDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/stats',
      component: () => import('@/views/StatsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue') }
  ]
})

// Guard global
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.user) {
    return { path: '/login' }
  }
  
  if (to.meta.guest && authStore.user) {
    return { path: '/' }
  }
})

export default router
```

---

## 9. VARIABLES D'ENVIRONNEMENT

### `.env.example`
```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# App
VITE_APP_NAME=UrsUle
VITE_APP_URL=https://ursule.vercel.app

# Encryption
VITE_AES_SECRET=your-32-char-secret-key-here!!

# Google OAuth (Drive)
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 10. CONFIGURATION VITE (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@vueuse/core'],
          'vendor-charts': ['chart.js', 'vue-chartjs'],
          'vendor-editor': ['@tiptap/vue-3', '@tiptap/starter-kit'],
        }
      }
    }
  }
})
```

---

## 11. PERFORMANCE & OPTIMISATIONS

| Technique | Implémentation |
|---|---|
| Lazy loading routes | `() => import(...)` sur toutes les vues |
| Pagination | Offset-based, 20 tâches/page |
| Debounce recherche | 300ms sur input de recherche |
| Optimistic updates | Mise à jour UI avant confirmation serveur |
| Image compression | `canvas.toBlob` avant upload |
| Virtual scrolling | `vue-virtual-scroller` pour > 100 items |
| Supabase cache | `staleTime: 60s` pour les listes |

---

## 12. EDGE FUNCTION WEBHOOK (`supabase/functions/webhook-dispatcher/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { taskId, eventType, webhookUrl } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Récupérer la tâche
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
    }
  }

  // Appel webhook
  let success = false
  let responseStatus = 0
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'UrsUle/1.0' },
      body: JSON.stringify(payload),
    })
    responseStatus = response.status
    success = response.ok
  } catch (e) {
    success = false
  }

  // Log
  await supabase.from('webhook_logs').insert({
    task_id: taskId, webhook_url: webhookUrl,
    event_type: eventType, payload, response_status: responseStatus, success
  })

  return new Response(JSON.stringify({ success }), { headers: { 'Content-Type': 'application/json' } })
})
```

---
*TDD — Référence technique principale pour les développeurs*
