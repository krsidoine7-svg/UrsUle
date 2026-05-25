# 🚀 MVP V1 — UrsUle : Guide d'Implémentation Feature par Feature
**À COLLER DIRECTEMENT DANS TON OUTIL IA**  
**Stratégie : 1 feature = 1 prompt = 1 validation avant passage à la suivante**

---

> ⚠️ **INSTRUCTIONS D'UTILISATION :**
> 1. Copie UN SEUL bloc à la fois dans ton outil IA
> 2. Exécute les commandes dans l'ordre
> 3. Teste avec les critères indiqués
> 4. Valide (✅) avant de copier le bloc suivant
> 5. Ne jamais sauter une étape

---

## ═══════════════════════════════════════
## 🟦 FEATURE 0 — SETUP PROJET
## ═══════════════════════════════════════

```
CONTEXTE : Je crée une application web appelée UrsUle — un gestionnaire d'agenda et de tâches.
Stack : Vue 3 + TypeScript + Vite + Tailwind CSS + shadcn-vue + Supabase + Vercel.
Couleurs : bleu (#2563EB), vert forêt (#16A34A), blanc.
Police : Sora (titres) + Inter (corps).

TÂCHE : Initialise le projet complet.

ÉTAPES :

1. Crée le projet Vue 3 :
npm create vue@latest ursule
→ Choisir : TypeScript ✅, JSX ❌, Vue Router ✅, Pinia ✅, Vitest ❌, ESLint ✅, Prettier ✅

2. cd ursule && npm install

3. Installe Tailwind CSS :
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography tailwindcss-animate
npx tailwindcss init -p

4. Installe les dépendances UI :
npm install lucide-vue-next @supabase/supabase-js
npm install class-variance-authority clsx tailwind-merge
npm install radix-vue

5. Initialise shadcn-vue :
npx shadcn-vue@latest init
→ TypeScript: Yes, base color: Slate, CSS variables: Yes

6. Crée le fichier tailwind.config.ts avec cette configuration EXACTE :
[Insérer le contenu de DESIGN_SYSTEM.md section 8]

7. Dans src/assets/main.css, ajoute :
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

8. Crée src/lib/utils.ts :
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

9. Configure les alias dans vite.config.ts :
resolve: { alias: { '@': path.resolve(__dirname, './src') } }

10. Crée .env.local :
VITE_SUPABASE_URL=https://TON_ID.supabase.co
VITE_SUPABASE_ANON_KEY=TA_CLE_ANON
VITE_APP_NAME=UrsUle

11. npm run dev → l'app doit démarrer sans erreur

RÉSULTAT ATTENDU : App Vue 3 qui démarre, Tailwind configuré, shadcn-vue prêt.

✅ VALIDATION : npm run dev → page blanche sans erreur dans la console
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 1 — BASE DE DONNÉES SUPABASE
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Vue 3 + Supabase PostgreSQL.
J'ai déjà créé un projet sur supabase.com.

TÂCHE : Crée tout le schéma de base de données.

Exécute ces SQL dans l'ordre dans l'éditeur SQL de Supabase :

═══ FICHIER : 001_init_schema.sql ═══

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles
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

-- Trigger création profil automatique
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Table categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  is_system BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table projects
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
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table tasks (principale)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  description_json JSONB,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','archived','rescheduled','to_redo')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  recurrence_type TEXT CHECK (recurrence_type IN ('none','daily','weekly','monthly','custom')),
  recurrence_config JSONB,
  recurrence_parent_id UUID REFERENCES tasks(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  color TEXT,
  tags TEXT[] DEFAULT '{}',
  validation_type TEXT DEFAULT 'calc' CHECK (validation_type IN ('calc','question','none')),
  validation_question TEXT,
  validation_answer TEXT,
  validation_attempts INTEGER DEFAULT 0,
  appreciation TEXT CHECK (appreciation IN ('happy','too_hard','boring','nothing_learned','super_productive','stressful','enriching','neutral')),
  webhook_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table task_comments
CREATE TABLE task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table task_images
CREATE TABLE task_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table time_sessions
CREATE TABLE time_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  session_type TEXT DEFAULT 'chrono' CHECK (session_type IN ('chrono','timer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table webhook_logs
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

-- Index
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);


═══ FICHIER : 002_rls_policies.sql ═══

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Categories
CREATE POLICY "categories_own" ON categories FOR ALL USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "tasks_own_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_own_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_own_update" ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_own_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Task comments
CREATE POLICY "comments_via_task" ON task_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

-- Task images
CREATE POLICY "images_via_task" ON task_images FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_images.task_id AND tasks.user_id = auth.uid())
);

-- Time sessions
CREATE POLICY "sessions_own" ON time_sessions FOR ALL USING (auth.uid() = user_id);

-- Webhook logs
CREATE POLICY "webhooks_own" ON webhook_logs FOR ALL USING (auth.uid() = user_id);


═══ FICHIER : 003_default_categories.sql ═══
-- Fonction pour créer les catégories système au premier login
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, is_system, sort_order) VALUES
    (p_user_id, 'Personnel',     '#3B82F6', 'user',        TRUE, 1),
    (p_user_id, 'Travail',       '#2563EB', 'briefcase',   TRUE, 2),
    (p_user_id, 'Apprentissage', '#8B5CF6', 'book-open',   TRUE, 3),
    (p_user_id, 'Finance',       '#16A34A', 'dollar-sign', TRUE, 4),
    (p_user_id, 'Santé',         '#EF4444', 'heart',       TRUE, 5),
    (p_user_id, 'Projets',       '#F59E0B', 'folder-open', TRUE, 6);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appel automatique après création de profil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  PERFORM create_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RÉSULTAT ATTENDU : Toutes les tables créées, RLS activé, trigger fonctionnel.

✅ VALIDATION : Dans Table Editor Supabase → voir tasks, profiles, categories, projects
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 2 — CLIENT SUPABASE & TYPES
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Vue 3 + TypeScript. 
Supabase configuré avec les tables : profiles, categories, projects, tasks, task_comments, task_images, time_sessions.

TÂCHE : Crée le client Supabase typé et tous les types TypeScript.

1. Crée src/services/supabase.ts :

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes dans .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

2. Crée src/types/task.types.ts (copier le contenu complet du TDD section 7)

3. Crée src/types/project.types.ts :

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  deadline?: string
  budget?: number
  budget_currency: string
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  tasks?: Task[]
  task_count?: number
  completed_task_count?: number
}

4. Crée src/types/user.types.ts :

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  timezone: string
  preferences: Record<string, unknown>
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
  sort_order: number
  created_at: string
}

5. Test : dans App.vue, ajoute temporairement :
import { supabase } from '@/services/supabase'
console.log('Supabase client:', supabase)
→ npm run dev → vérifier dans la console du navigateur

✅ VALIDATION : Console affiche le client Supabase sans erreur "undefined"
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 3 — AUTHENTIFICATION
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Vue 3 + TypeScript + Pinia + Vue Router + Supabase Auth.
Tous les types et le client Supabase sont déjà créés.

TÂCHE : Crée le système d'authentification complet.

1. Installe les composants shadcn nécessaires :
npx shadcn-vue@latest add button input label card alert

2. Crée src/stores/auth.store.ts :

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import type { Profile } from '@/types/user.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Profile | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchProfile(session.user.id)
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        user.value = null
      }
    })
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) user.value = data as Profile
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Email ou mot de passe incorrect')
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
    if (error) throw error
  }

  return { user, loading, isAuthenticated, initialize, signIn, signUp, signOut, resetPassword }
})

3. Configure le Router avec guards (src/router/index.ts) :
[Routes : /login, /register, /forgot-password (guest), / (requiresAuth), /tasks, /projects, /calendar, /stats, /settings]
Guard : vérifier session Supabase avant chaque route protégée

4. Crée src/views/auth/LoginView.vue :
- Design : centré verticalement, logo UrsUle en haut, formulaire dans une Card
- Champs : Email, Mot de passe, Bouton "Se connecter"
- Lien "Créer un compte" et "Mot de passe oublié"
- Message d'erreur si credentials incorrects
- Loading spinner pendant la connexion
- Couleurs : fond neutral-50, card blanche, bouton primary-600
- Police : Sora pour le titre UrsUle

5. Crée src/views/auth/RegisterView.vue :
- Champs : Nom complet, Email, Mot de passe (min 8 chars, 1 majuscule, 1 chiffre)
- Indicateur de force du mot de passe
- Message de succès : "Vérifie ton email pour confirmer ton compte"

6. Crée src/views/auth/ForgotPasswordView.vue :
- Champ email uniquement
- Message de confirmation envoi

7. Initialise l'auth dans src/main.ts :
const authStore = useAuthStore()
await authStore.initialize()

8. Crée src/views/DashboardView.vue (basique pour l'instant) :
- Juste un h1 "Bonjour [nom]" + bouton déconnexion

RÉSULTAT ATTENDU : Système de connexion complet et fonctionnel.

✅ VALIDATION :
- Créer un compte → email de confirmation reçu
- Se connecter → voir "Bonjour Krsidoine"
- Accéder /tasks sans connexion → redirigé /login
- Déconnexion → redirigé /login
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 4 — LAYOUT PRINCIPAL
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Authentification fonctionnelle. 
Je dois créer le layout principal de l'application (sidebar + header + contenu).

TÂCHE : Crée le layout complet de l'application.

1. Installe : npx shadcn-vue@latest add separator avatar tooltip

2. Crée src/components/common/AppLogo.vue :
- Carré bleu arrondi avec "U" blanc en gras (police Sora)
- Texte "UrsUle" à côté en bleu primaire
- Prop : collapsed (boolean) → cacher le texte si true

3. Crée src/components/common/NavItem.vue :
- Lien de navigation avec icône Lucide + label
- Actif : fond bleu-50, texte bleu-600, icône bleue
- Hover : fond neutral-100
- Si collapsed : montrer seulement l'icône (avec tooltip)
- Transitions douces

4. Crée src/components/common/AppSidebar.vue :
Navigation items dans l'ordre :
- Dashboard (LayoutDashboard) → /
- Mes tâches (CheckSquare) → /tasks  
- Projets (FolderOpen) → /projects
- Calendrier (Calendar) → /calendar
- Statistiques (BarChart2) → /stats
- [séparateur]
- Paramètres (Settings) → /settings

En bas :
- Avatar utilisateur + nom + email (tronqué)
- Bouton déconnexion (LogOut icon)

Comportement :
- Collapsible (w-64 ↔ w-16) avec bouton toggle
- Persistance état collapse (localStorage 'sidebar_collapsed')
- Responsive : sur mobile (< 768px) → drawer overlay

5. Crée src/components/common/AppHeader.vue :
- Bouton breadcrumb/titre de page (dynamique par route)
- Bouton "Nouvelle tâche" (Plus icon, primary)
- Icône notification avec badge (cloche)
- Avatar utilisateur (cliquable → menu)

6. Crée src/App.vue avec le layout conditionnel :
- Routes /login, /register, /forgot-password → Layout minimal (juste <RouterView>)
- Autres routes → Layout complet (sidebar + header + content)

7. Crée src/stores/ui.store.ts :
- sidebarCollapsed (boolean)
- activeView ('list' | 'grid' | 'kanban' | 'calendar')
- currentPage (string)

STYLE PRÉCIS :
- Sidebar : bg-white, border-r border-neutral-200
- Header : bg-white, border-b border-neutral-200, h-16, sticky top-0
- Contenu : bg-neutral-50, padding 24px 32px
- Font globale : Inter
- Titres : Sora

✅ VALIDATION :
- Se connecter → voir sidebar à gauche avec les 6 items de navigation
- Cliquer sur "Mes tâches" → URL change, item actif mis en évidence
- Cliquer le bouton collapse → sidebar réduite aux icônes
- Hover icône en mode collapsed → tooltip avec le nom
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 5 — GESTION DES TÂCHES (CRUD)
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Layout principal prêt, Supabase configuré.
Tables tasks et categories existent avec RLS.

TÂCHE : Crée le CRUD complet des tâches.

Installe : npx shadcn-vue@latest add sheet dialog dropdown-menu badge select popover calendar

1. Crée src/services/tasks.service.ts :
[Copier exactement le contenu du TDD section 6.2]

2. Crée src/stores/tasks.store.ts :
[Copier exactement le contenu du TDD section 6.3]

3. Crée src/stores/categories.store.ts :
- Charger les catégories de l'utilisateur au login
- CRUD catégories
- Catégories disponibles pour les selects

4. Crée src/components/common/StatusBadge.vue :
[Voir DESIGN_SYSTEM section 4.2]

5. Crée src/components/common/PriorityBadge.vue :
[Voir DESIGN_SYSTEM section 4.3]

6. Crée src/components/common/CategoryBadge.vue :
- Petit badge coloré avec la couleur de la catégorie
- Texte blanc sur fond coloré
- Arrondi complet

7. Crée src/components/tasks/TaskCard.vue :
[Voir DESIGN_SYSTEM section 4.4]
Émettre : @click, @update-status, @delete

8. Crée src/components/tasks/TaskForm.vue (Sheet/Slide-over) :
CHAMPS OBLIGATOIRES :
- Titre (input, obligatoire)
- Priorité (select : Faible/Normale/Haute/Urgente)
- Catégorie (select avec les catégories de l'utilisateur)
- Deadline (date picker avec heure)

CHAMPS OPTIONNELS (section expansible) :
- Description (textarea pour l'instant, éditeur riche en Feature 5)
- Durée estimée (input number + select: minutes/heures)
- Projet (select)
- Tags (input chips)
- Couleur (palette 8 couleurs)
- Épingler (switch)
- Récurrence (select)
- Type de validation (select: Calcul/Question/Aucune)

Comportement :
- Sheet qui s'ouvre depuis la droite (shadcn Sheet)
- Mode création et édition (même composant, prop: task?)
- Validation Zod avant soumission
- Loading state pendant la sauvegarde
- Toast de succès/erreur

9. Crée src/components/tasks/TaskList.vue :
- Tableau avec colonnes : [Pin] Titre | Statut | Priorité | Catégorie | Deadline | Actions
- Tri par colonne (clic entête)
- Checkbox pour sélection multiple
- Menu actions (3 points) : Éditer, Dupliquer, Épingler, Archiver, Supprimer
- Lignes épinglées en haut avec fond amber-50
- Pagination : 20 tâches / page

10. Crée src/views/TasksView.vue :
- Header : Titre "Mes tâches" + compteur + bouton "Nouvelle tâche"
- Barre de filtres : Statut | Priorité | Catégorie | Recherche
- Switcher de vues : List | Grid | Kanban | Calendar (icônes)
- Afficher TaskList (vue par défaut)
- Corbeille (onglet ou bouton) : tâches deleted_at non null

11. Crée src/components/tasks/TaskDetail.vue (Sheet détail complet) :
- S'ouvre quand on clique sur une tâche dans la liste
- Affiche TOUS les champs de la tâche
- Bouton "Éditer" → ouvre TaskForm en mode édition
- Section commentaires (liste simple pour l'instant)

RÈGLES DE STYLE :
- La liste principale : tâches épinglées en haut avec icône pin amber
- Urgentes : icône Flame rouge
- En retard (deadline dépassée) : deadline en rouge
- Hover row : fond neutral-50
- Transitions sur toutes les actions

✅ VALIDATION :
- Créer une tâche "Tester UrsUle" deadline demain, priorité Urgente → apparaît dans la liste
- Cliquer sur la tâche → sheet de détail s'ouvre
- Modifier le statut → mis à jour en temps réel
- Épingler la tâche → remonte en haut de la liste avec icône pin
- Supprimer → disparaît de la liste
- Filtrer par "Urgente" → seule la tâche urgente visible
- Rechercher "Tester" → tâche trouvée
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 6 — VUES D'AFFICHAGE
## ═══════════════════════════════════════

```
CONTEXTE : Vue liste des tâches fonctionne. Je dois ajouter les vues Grille et Kanban.

TÂCHE : Crée les vues Grid et Kanban.

1. Installe : npm install vue-draggable-plus

2. Crée src/components/tasks/TaskGrid.vue :
- Grille responsive (1 col mobile, 2 col tablet, 3 col desktop, 4 col large)
- Utilise TaskCard.vue pour chaque tâche
- Animation d'apparition : fadeInUp avec stagger (50ms entre chaque carte)
- Les cartes épinglées ont une bordure gauche amber-400

3. Crée src/components/tasks/TaskKanban.vue :
- 4 colonnes fixes : À faire | En cours | Terminé | Reporté
- Chaque colonne : header coloré + compteur + liste de TaskCard
- Drag & Drop entre colonnes avec vue-draggable-plus
- Quand on drop dans une colonne → mise à jour du statut en DB
- Bouton "+" dans chaque colonne → ouvre TaskForm avec le statut pré-rempli
- Colonnes scrollables indépendamment (hauteur fixe = viewport - header)
- Style colonnes :
  - À faire : bg-neutral-50, border-top neutral-300
  - En cours : bg-blue-50, border-top blue-400
  - Terminé : bg-green-50, border-top green-400
  - Reporté : bg-yellow-50, border-top yellow-400

4. Crée src/components/common/ViewSwitcher.vue :
- 4 boutons icônes : List (List), Grid (LayoutGrid), Kanban (Columns3), Calendar (Calendar)
- Actif : fond primary-600, icône blanche
- Inactif : fond transparent, icône neutral-400
- Persistance dans ui.store et localStorage

5. Intègre dans TasksView.vue :
- <ViewSwitcher> dans le header
- <component :is="activeViewComponent"> (TaskList | TaskGrid | TaskKanban)
- Transition fade entre les vues

✅ VALIDATION :
- Cliquer sur icône Grid → tâches en grille 3 colonnes
- Cliquer Kanban → 4 colonnes colorées
- Glisser une tâche de "À faire" vers "En cours" → statut mis à jour en DB
- Ajouter une tâche depuis la colonne Kanban → tâche créée avec bon statut
- Changer de vue → préférence sauvegardée (reload → même vue)
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 7 — ÉDITEUR DE TEXTE RICHE
## ═══════════════════════════════════════

```
CONTEXTE : Formulaire de tâche avec textarea simple pour la description.
Je dois remplacer par un éditeur riche Tiptap.

TÂCHE : Intègre Tiptap comme éditeur de texte riche.

1. Installe :
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-character-count

2. Crée src/components/common/RichTextEditor.vue :

TOOLBAR (barre d'outils) :
Groupe 1 — Texte : H1 | H2 | H3 | Gras (B) | Italique (I) | Barré (S)
Groupe 2 — Listes : Liste à puces | Liste numérotée | Check list
Groupe 3 — Insertion : Code inline | Bloc code | Lien | Citation
Groupe 4 — Actions : Annuler | Refaire

STYLE TOOLBAR :
- Position : sticky en haut de l'éditeur
- Fond : white, border-bottom neutral-200
- Boutons : 28px x 28px, arrondi, hover bg-neutral-100
- Actif : bg-primary-100, text-primary-600
- Séparateurs entre groupes : border-r neutral-200

ÉDITEUR :
- Hauteur min : 120px, auto-grow
- Focus : outline primary-600
- Placeholder : "Décris ta tâche ici... (Markdown supporté)"
- Prose tailwindcss pour le rendu

TOGGLE MARKDOWN :
- Bouton "{ }" dans la toolbar → mode Markdown brut (textarea)
- Les deux modes sont synchronisés

PROPS :
- modelValue: string (Markdown) ou Object (Tiptap JSON)
- placeholder?: string
- readonly?: boolean

ÉMISSIONS :
- @update:modelValue
- @change

3. Remplace le textarea dans TaskForm.vue par <RichTextEditor>

4. Dans TaskDetail.vue : affichage read-only avec le rendu HTML

✅ VALIDATION :
- Taper "# Mon titre" → rendu comme titre H1 dans l'éditeur
- Sélectionner du texte → clic Gras → texte **gras**
- Créer une checklist (extension task-list) avec 3 items → les checkboxes sont cliquables
- Toggle Markdown → voir le code brut
- Toggle retour → rendu correct
- La description est sauvegardée en JSON dans description_json et en Markdown dans description
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 8 — TIMER & CHRONOMÈTRE
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Tâches CRUD fonctionnel.
Je dois ajouter un timer et chronomètre par tâche.

TÂCHE : Crée le système de timer et chronomètre.

1. Crée src/composables/useTimer.ts :

import { ref, computed, onUnmounted } from 'vue'

export function useTimer() {
  const isRunning = ref(false)
  const mode = ref<'chrono' | 'timer'>('chrono')
  const elapsedSeconds = ref(0)
  const targetSeconds = ref(0)  // Pour le timer décompte
  let interval: ReturnType<typeof setInterval> | null = null

  const display = computed(() => {
    const s = mode.value === 'chrono' 
      ? elapsedSeconds.value 
      : Math.max(0, targetSeconds.value - elapsedSeconds.value)
    const mm = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  })

  const isFinished = computed(() => 
    mode.value === 'timer' && elapsedSeconds.value >= targetSeconds.value
  )

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    interval = setInterval(() => {
      elapsedSeconds.value++
      if (isFinished.value) {
        pause()
        notifyFinished()
      }
    }, 1000)
  }

  function pause() {
    isRunning.value = false
    if (interval) clearInterval(interval)
  }

  function stop() {
    pause()
    const duration = elapsedSeconds.value
    elapsedSeconds.value = 0
    return Math.ceil(duration / 60)  // Retourner en minutes
  }

  function setTimer(minutes: number) {
    mode.value = 'timer'
    targetSeconds.value = minutes * 60
    elapsedSeconds.value = 0
  }

  function setChrono() {
    mode.value = 'chrono'
    elapsedSeconds.value = 0
  }

  function notifyFinished() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ UrsUle — Timer terminé !', {
        body: 'Ton temps de travail est écoulé.',
        icon: '/favicon.ico'
      })
    }
  }

  onUnmounted(() => { if (interval) clearInterval(interval) })

  return { isRunning, mode, display, isFinished, start, pause, stop, setTimer, setChrono, elapsedSeconds }
}

2. Crée src/components/common/TimerWidget.vue :

INTERFACE :
- Affichage MM:SS (police : JetBrains Mono, taille xl, text-neutral-800)
- 2 onglets : "Chrono ↑" | "Timer ↓"
- Mode Chrono : boutons Start/Pause/Stop
- Mode Timer : input durée (minutes) + boutons Start/Pause/Stop
- Indicateur animé quand actif (point rouge clignotant)
- En bas : "Temps écoulé aujourd'hui : Xh XXmin"

COMPORTEMENT :
- Widget persistant (float en bas à droite de l'app) quand un timer est actif
- Cliquable pour agrandir/réduire
- S'intègre aussi dans le détail d'une tâche

3. Intègre dans TaskDetail.vue :
- Bouton "Démarrer le chrono" dans le header de la tâche
- Quand arrêté → propose de sauvegarder la session
- Sauvegarde dans time_sessions en DB
- Affiche le total : "Temps total passé : 1h 23min"

4. Demande permission notifications au démarrage de l'app :
if ('Notification' in window) Notification.requestPermission()

✅ VALIDATION :
- Ouvrir une tâche → cliquer "Démarrer le chrono" → MM:SS s'incrémente
- Naviguer vers une autre page → le chrono continue (widget flottant visible)
- Arrêter → "Sauvegarder la session ?" → Oui → visible dans le détail
- Créer un timer 1 minute → notification navigateur après 1 minute
- Total temps affiché correctement dans la tâche
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 9 — VALIDATION GAMIFIÉE
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — CRUD tâches fonctionnel avec timer.
Feature différenciante : validation par quiz avant de marquer une tâche comme terminée.

TÂCHE : Crée le système de validation gamifiée.

1. Crée src/utils/validation-challenge.ts :

export type Challenge = {
  type: 'calc' | 'question'
  question: string
  answer: string
  hint?: string
}

// Génère un calcul selon la difficulté
export function generateCalcChallenge(priority: string): Challenge {
  const difficulty = { low: 1, normal: 2, high: 3, urgent: 4 }[priority] ?? 2
  
  let a: number, b: number, op: string, answer: number
  
  if (difficulty === 1) {
    a = Math.floor(Math.random() * 10) + 1
    b = Math.floor(Math.random() * 10) + 1
    op = '+'
    answer = a + b
  } else if (difficulty === 2) {
    a = Math.floor(Math.random() * 20) + 5
    b = Math.floor(Math.random() * 10) + 2
    op = Math.random() > 0.5 ? '+' : '-'
    answer = op === '+' ? a + b : a - b
  } else if (difficulty === 3) {
    a = Math.floor(Math.random() * 12) + 2
    b = Math.floor(Math.random() * 12) + 2
    op = '×'
    answer = a * b
  } else {
    // Difficile : calcul à deux opérations
    a = Math.floor(Math.random() * 10) + 2
    b = Math.floor(Math.random() * 10) + 2
    const c = Math.floor(Math.random() * 10) + 1
    answer = a * b + c
    return {
      type: 'calc',
      question: `Combien fait ${a} × ${b} + ${c} ?`,
      answer: answer.toString()
    }
  }
  
  return {
    type: 'calc',
    question: `Combien fait ${a} ${op} ${b} ?`,
    answer: answer.toString()
  }
}

2. Crée src/components/tasks/ValidationModal.vue :

INTERFACE :
- Dialog modal centré, bloquant (no click outside to close)
- Header : "🎯 Prouve que tu as terminé !" + titre de la tâche
- Corps : question affichée en grand (text-2xl, font-display)
- Input réponse : grand, centré, type number pour les calculs
- Bouton "Valider" (primary) + "Annuler" (danger/ghost)
- Compteur tentatives : "Tentative 1/3" avec points visuels
- Animation shake sur mauvaise réponse
- Animation ✅ sur bonne réponse avant fermeture

LOGIQUE :
- Prop : task (pour générer le bon type de défi)
- Si task.validation_type === 'none' : sauter directement à l'appréciation
- Si task.validation_type === 'calc' : générer un calcul
- Si task.validation_type === 'question' : afficher task.validation_question
  → La réponse est textuelle, vérifier si elle contient task.validation_answer (case insensitive)

APRÈS 3 ÉCHECS :
- Message : "😔 Tu devras reprendre cette tâche plus tard"
- Mettre le statut → 'to_redo'
- Fermer et afficher un badge rouge sur la tâche

APRÈS SUCCÈS :
- Animation de confettis (simple : particules CSS)
- Délai 1 seconde → ouvre AppreciationModal

ÉMISSIONS :
- @success (taskId)
- @failure (taskId)
- @cancel

3. Intègre dans TaskDetail.vue et TaskCard.vue :
- Bouton "Marquer comme terminée" → ouvre ValidationModal
- Ne jamais mettre le statut 'done' sans passer par ValidationModal

4. Crée src/composables/useValidation.ts :
- Logique de vérification réponse
- Sauvegarde du nombre de tentatives en DB
- Gestion du statut après succès/échec

✅ VALIDATION :
- Cliquer "Terminer" sur une tâche priorité Normale → modal avec calcul
- Entrer mauvaise réponse → shake + "Tentative 2/3"
- Entrer bonne réponse → animation succès
- Échouer 3 fois → tâche passe en "À reprendre", badge rouge
- Tâche avec validation_type='none' → pas de modal, directement appréciation
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 10 — APPRÉCIATION POST-TÂCHE
## ═══════════════════════════════════════

```
CONTEXTE : Validation gamifiée fonctionne. Après succès, demander le ressenti.

TÂCHE : Crée la modal d'appréciation post-tâche.

1. Crée src/components/tasks/AppreciationModal.vue :

INTERFACE :
- Dialog léger (pas bloquant — clickable outside = Neutre)
- Titre : "Comment tu te sens après cette tâche ?"
- Sous-titre : "Tap sur ton humeur du moment"
- Grille 4x2 de boutons emoji (2 lignes, 4 colonnes)
- Timer dégressif : barre de progression 5 secondes (après = Neutre auto)

ÉMOJIS (dans l'ordre) :
😊 Content/Satisfait   🚀 Super productif
💡 Très enrichissant   😐 Neutre
😤 Trop difficile      😰 Stressant
😴 Ennuyeux            🤔 Rien appris

CHAQUE BOUTON :
- Emoji grand (text-3xl)
- Label sous l'emoji (text-xs, neutral-600)
- Hover : scale(1.1) + ombre colorée matching l'émotion
- Sélectionné : bordure colorée + fond léger

COMPORTEMENT :
- Timer visible : "Fermeture dans Xs" avec barre qui rétrécit
- Clic → sauvegarde + ferme
- Fermeture auto → 'neutral' sauvegardé
- Animation d'entrée : slideUp depuis le bas

2. Intègre la chaîne complète dans useValidation.ts :
Compléter tâche → ValidationModal → (succès) → AppreciationModal → Toast "✅ Tâche accomplie !"

3. Affiche l'emoji d'appréciation dans :
- TaskCard.vue (petit emoji en bas à droite de la carte)
- TaskList.vue (colonne dédiée ou tooltip)
- Stats (graphique des humeurs en Feature 12)

✅ VALIDATION :
- Réussir la validation → AppreciationModal apparaît
- Sélectionner "🚀 Super productif" → sauvegardé dans la tâche
- Attendre 5 secondes → "Neutre" sauvegardé automatiquement
- L'emoji 🚀 est visible dans la card de la tâche
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 11 — PROJETS
## ═══════════════════════════════════════

```
CONTEXTE : CRUD tâches complet. Je dois ajouter la gestion de projets.

TÂCHE : Crée le module de gestion de projets.

1. Crée src/services/projects.service.ts (CRUD projets + stats)
2. Crée src/stores/projects.store.ts (Pinia)

3. Crée src/components/projects/ProjectCard.vue :
- Card avec : couleur de fond (version light), icône, nom
- Barre de progression (%) calculée : tâches done / total
- Deadline avec couleur selon urgence 
- Compteur tâches : "5 tâches, 2 terminées"
- Hover : shadow-card-hover
- Clic → navigate vers /projects/:id

4. Crée src/components/projects/ProjectForm.vue (Sheet) :
CHAMPS :
- Nom (input, obligatoire)
- Description (textarea)
- Couleur (palette 8 couleurs)
- Icône (grid de 16 icônes Lucide)
- Statut (select)
- Deadline (date picker)
- Budget (input number + label FCFA)

5. Crée src/views/ProjectsView.vue :
- Header : "Mes projets" + "Nouveau projet"
- Grille 3 colonnes de ProjectCard
- Stats rapides : X projets actifs, X terminés
- Filtres : Actif | En pause | Terminé | Archivé

6. Crée src/views/ProjectDetailView.vue :
Header :
- Nom du projet + couleur + progression globale (cercle %)
- Boutons : Éditer | Archiver

Onglets :
- "Tâches" → liste/kanban des tâches du projet (réutiliser TaskList/TaskKanban)
- "Notes" → éditeur Tiptap pour les notes du projet (sauvegardé en Markdown)
- "Infos" → deadline, budget, statut, créé le

7. Dans TaskForm.vue : select "Projet" → liste des projets actifs

8. Sur le Dashboard : widget "Projets actifs" avec les 3 plus récents

✅ VALIDATION :
- Créer un projet "Mon Premier Projet" → visible dans la grille
- Créer 2 tâches liées à ce projet → dans ProjectDetail → onglet Tâches
- Compléter 1 tâche → progression passe à 50%
- Notes du projet → sauvegarder du Markdown → visible en re-ouvrant
- Archiver le projet → disparaît de la vue "Actifs"
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 12 — DASHBOARD COMPLET
## ═══════════════════════════════════════

```
CONTEXTE : Tâches + projets fonctionnels.
Je dois créer un dashboard riche avec des vrais widgets de données.

TÂCHE : Complète le dashboard avec des widgets de données réelles.

1. Crée src/components/dashboard/widgets/ :

DayOverviewWidget.vue :
- "Tâches du jour" : liste les tâches avec deadline aujourd'hui
- Compteur : X/Y complétées avec mini barre de progression
- Lien "Voir toutes"

UrgentWidget.vue :
- Liste des tâches priorité URGENT non terminées
- Chaque item : titre + deadline relative ("Dans 2h", "En retard depuis 1j")
- Fond rouge-50, texte rouge

StreakWidget.vue :
- Nombre de jours consécutifs de productivité
- Animation de flamme si streak > 3
- Calcul : jours où au moins 1 tâche complétée

ProjectsProgressWidget.vue :
- 3 projets actifs avec barres de progression
- Clic → navigate vers le projet

QuickCreateWidget.vue :
- Input rapide : taper un titre + appuyer Entrée → créer tâche immédiatement
- Avec deadline "Aujourd'hui" par défaut

RecentActivityWidget.vue :
- 5 dernières actions (tâche créée, complétée, commentaire)
- Timeline visuelle avec icônes

2. Crée src/views/DashboardView.vue complet :
LAYOUT :
- Ligne 1 : 3 métriques rapides (cards) : Aujourd'hui | Cette semaine | Streak
- Ligne 2 : DayOverview (2/3) + Urgent (1/3)
- Ligne 3 : QuickCreate + Projects Progress
- Ligne 4 : Recent Activity

MÉTRIQUES :
- Tâches du jour : X/Y complétées
- Cette semaine : X complétées
- Streak : X jours
- Taux de réussite : X% (tâches validées / créées ce mois)

SALUTATION :
- Matin (5h-12h) : "Bonjour [Prénom] ☀️"
- Après-midi (12h-18h) : "Bon après-midi [Prénom] 💪"
- Soir (18h-23h) : "Bonsoir [Prénom] 🌙"
- Heure locale : Africa/Abidjan

3. Dans le header de chaque page : breadcrumb dynamique selon la route

✅ VALIDATION :
- Dashboard affiche les bonnes données (créer quelques tâches d'abord)
- Les métriques se mettent à jour quand on revient du dashboard
- "Créer rapidement" → taper titre + Entrée → tâche créée et visible
- Salutation correcte selon l'heure actuelle
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 13 — STATISTIQUES
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle — Toutes les features de base fonctionnent.
Je dois créer la page de statistiques avec des vrais graphiques.

TÂCHE : Crée la page de statistiques complète.

1. Installe : npm install chart.js vue-chartjs

2. Crée src/services/stats.service.ts :
Requêtes Supabase pour :
- getTodayStats(userId) → tâches créées/complétées aujourd'hui
- getWeeklyStats(userId, weekStart) → par jour de la semaine
- getMonthlyStats(userId, month, year) → par jour du mois
- getCompletionRate(userId, from, to) → taux de complétion
- getMoodDistribution(userId, from, to) → répartition des appréciations
- getCategoryDistribution(userId, from, to) → répartition par catégorie
- getProjectProgress(userId) → progression des projets actifs
- getStreakData(userId) → données pour le heatmap (180 derniers jours)
- getCustomRange(userId, from, to) → période personnalisée

3. Crée src/views/StatsView.vue :

HEADER :
- Titre "Statistiques"
- Date range picker (cette semaine | ce mois | 3 mois | personnalisé)
- Filtres secondaires : Catégorie | Projet

SECTION 1 — Résumé (4 métriques) :
- Total tâches créées sur la période
- Total tâches complétées
- Taux de complétion (%)
- Temps total travaillé

SECTION 2 — Graphiques :

CompletionChart.vue (Line chart) :
- Titre : "Tâches complétées par jour"
- Axe X : dates, Axe Y : nombre de tâches
- Deux lignes : Créées (bleu) vs Complétées (vert)
- Données : selon la période sélectionnée

CategoryChart.vue (Doughnut chart) :
- Titre : "Répartition par catégorie"
- Chaque segment = une catégorie avec sa couleur
- Légende en dessous
- Hover : affiche le nombre et % exact

MoodChart.vue (Bar chart horizontal) :
- Titre : "Ton humeur après les tâches"
- 8 barres horizontales (une par type d'appréciation)
- Couleur de chaque barre = couleur de l'humeur
- Émojis sur l'axe Y

TimeChart.vue (Bar chart) :
- Titre : "Temps passé (heures)"
- Par jour de la semaine ou par projet

HeatmapCalendar.vue :
- Titre : "Ta régularité (180 derniers jours)"
- Grille calendrier like GitHub contributions
- 4 niveaux de vert : 0 tâche (gris) | 1-2 (vert léger) | 3-5 (vert) | 6+ (vert foncé)
- Tooltip au hover : "X tâches le [date]"

4. Créer les 5 composants graphiques avec vue-chartjs :
- Configuration Chart.js : polices Sora/Inter, couleurs UrsUle, no legend box
- Responsive (fill container width)
- Animation au chargement
- Loading skeleton pendant fetch

✅ VALIDATION :
- Stats → graphique ligne "7 derniers jours" avec données réelles
- Changer vers "Ce mois" → graphique se recalcule
- Donut catégories → les catégories avec tâches apparaissent
- Heatmap → les jours avec tâches complétées sont colorés en vert
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 14 — EXPORT PDF & EXCEL
## ═══════════════════════════════════════

```
CONTEXTE : Toutes les features principales fonctionnent.

TÂCHE : Crée le système d'export.

1. Installe : npm install jspdf html2canvas xlsx

2. Crée src/composables/useExport.ts :

async function exportToPDF(tasks: Task[], filters: TaskFilters) :
- Créer un div HTML caché avec le contenu formaté :
  - Header : logo UrsUle + titre "Rapport de tâches" + date + filtres appliqués
  - Tableau : Titre | Statut | Priorité | Catégorie | Deadline | Durée | Appréciation
  - Footer : "Généré par UrsUle — ursule.vercel.app"
- html2canvas → capture → jsPDF → téléchargement "ursule-taches-[date].pdf"

async function exportToExcel(tasks: Task[]) :
- Transformer les tâches en tableau 2D :
  ['ID', 'Titre', 'Statut', 'Priorité', 'Catégorie', 'Deadline', 'Créé le', 'Durée estimée', 'Durée réelle', 'Appréciation']
  + données formatées en français
- xlsx.utils.aoa_to_sheet → workbook → téléchargement "ursule-taches-[date].xlsx"

async function exportToJSON(tasks: Task[]) :
- JSON.stringify avec 2 espaces d'indentation
- Blob → téléchargement "ursule-backup-[date].json"

3. Intègre dans TasksView.vue :
- Bouton "Exporter" (Download icon) dans le header
- Dropdown : PDF | Excel | JSON
- Respecte les filtres actifs (exporte uniquement les tâches visibles)
- Toast "Export en cours..." → "Export prêt ✅"

4. Dans StatsView.vue :
- Bouton "Exporter les stats" → PDF du rapport avec graphiques

✅ VALIDATION :
- Filtrer par catégorie "Travail" → Exporter PDF → uniquement les tâches Travail
- Export Excel → ouvre dans Excel/Google Sheets, colonnes en français
- Export JSON → fichier valide
- Le PDF contient le logo UrsUle et la date
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 15 — VUE CALENDRIER
## ═══════════════════════════════════════

```
CONTEXTE : Vues Liste/Grid/Kanban fonctionnelles.
Je dois ajouter la vue Calendrier complète.

TÂCHE : Crée la vue Calendrier avec FullCalendar.

1. Installe :
npm install @fullcalendar/vue3 @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list

2. Crée src/components/calendar/CalendarView.vue :

Configuration FullCalendar :
- Locale : 'fr' (importer @fullcalendar/core/locales/fr)
- Timezone : 'Africa/Abidjan'
- Vue initiale : 'dayGridMonth'
- Header toolbar : prev | today | next / title / dayGridMonth, timeGridWeek, timeGridDay, listWeek
- Hauteur : 'calc(100vh - 200px)'
- Événements = tâches avec deadline

Transformation tâche → événement :
{
  id: task.id,
  title: task.title,
  start: task.deadline,
  end: task.deadline,
  backgroundColor: priorityColors[task.priority],
  borderColor: priorityColors[task.priority],
  textColor: '#ffffff',
  extendedProps: { task }
}

Couleurs par priorité :
- low: '#94A3B8', normal: '#3B82F6', high: '#F59E0B', urgent: '#EF4444'

Interactions :
- Clic événement → ouvre TaskDetail slide-over
- Drag événement → modifie la deadline en DB (eventDrop callback)
- Clic date vide → ouvre TaskForm avec la date pré-remplie (dateClick callback)

3. Dans TasksView.vue : ajouter la vue Calendar dans le ViewSwitcher
4. Créer aussi /calendar comme page séparée avec le plein écran

✅ VALIDATION :
- Vue Calendrier → tâches visibles sur leur date de deadline
- Urgentes en rouge, normales en bleu
- Glisser une tâche vers un autre jour → deadline mise à jour
- Cliquer un jour → TaskForm avec cette date pré-remplie
- Cliquer une tâche → TaskDetail s'ouvre
- Changer vue mensuelle/hebdo/quotidienne → fonctionne
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 16 — SOUS-TÂCHES & CHECKLIST
## ═══════════════════════════════════════

```
CONTEXTE : TaskDetail fonctionne. Je dois ajouter les sous-tâches.

TÂCHE : Crée le système de sous-tâches.

1. Dans tasks.service.ts, ajoute :
- getSubtasks(parentId) : récupère les tâches avec parent_task_id = parentId
- createSubtask(parentId, title) : crée une tâche enfant

2. Crée src/components/tasks/SubTaskList.vue :

INTERFACE :
- Section dans TaskDetail : "Sous-tâches" avec compteur "2/5"
- Barre de progression verte (% de sous-tâches complétées)
- Liste des sous-tâches :
  - Checkbox (statut done/todo)
  - Titre (éditable inline, clic pour éditer)
  - Date (petite, si deadline)
  - Bouton supprimer (visible au hover)
- Input ajout en bas : "Ajouter une sous-tâche..." + Entrée pour sauvegarder
- Drag & Drop pour réordonner (vue-draggable-plus)

LOGIQUE :
- Cocher une sous-tâche → statut = 'done' → recalcule %
- Barre de progression de la tâche parent = % des sous-tâches
- Si toutes les sous-tâches done → proposer de compléter la tâche parent

3. Affiche l'indicateur dans TaskCard.vue et TaskList.vue :
- "3/5 ✓" en bas de la card (visible uniquement si sous-tâches > 0)
- Mini barre de progression sous le titre dans la liste

✅ VALIDATION :
- Ouvrir TaskDetail → section "Sous-tâches" visible
- Taper "Sous-tâche 1" + Entrée → créée et visible
- Ajouter 3 sous-tâches
- Cocher 2/3 → barre à 66%, indicateur "2/3" sur la card
- Réordonner par DnD → ordre sauvegardé
- Supprimer une sous-tâche → disparaît, % recalculé
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 17 — IMAGES DANS LES TÂCHES
## ═══════════════════════════════════════

```
CONTEXTE : TaskDetail fonctionnel. Je dois permettre l'upload d'images.

TÂCHE : Crée le système d'upload et galerie d'images.

1. Dans Supabase → Storage → Créer le bucket "task-images" :
- Public : Non (accès via signed URLs)
- Taille max objet : 5MB
- Types autorisés : image/jpeg, image/png, image/webp

2. Ajoute la politique Storage :
CREATE POLICY "task_images_own" ON storage.objects
  FOR ALL USING (
    bucket_id = 'task-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

3. Crée src/services/storage.service.ts :
- uploadImage(file, taskId) : valide type/taille → upload → insère dans task_images → retourne URL signée
- getImageUrl(storagePath) : génère URL signée (1 heure)
- deleteImage(imageId, storagePath) : supprime de Storage + table task_images
- getTaskImages(taskId) : récupère les images avec URLs signées

4. Crée src/components/common/FileUpload.vue :
- Zone drag & drop "Glisse tes images ici" avec icône Upload
- OU bouton "Parcourir" → input file (accept: "image/*")
- Preview immédiate (FileReader API) avant upload
- Barre de progression upload
- Validation : max 5 images, max 5MB chacune, type image uniquement
- Message d'erreur si hors limites

5. Intègre dans TaskDetail.vue :
Section "Images" :
- Grille de miniatures 80x80px (border-radius 8px)
- Bouton "+" pour ajouter (max 5 - existantes)
- Hover miniature → bouton ✕ de suppression (avec confirmation)
- Clic miniature → Lightbox

6. Crée src/components/common/Lightbox.vue :
- Overlay sombre full-screen
- Image centrée (max 90vh, max 90vw)
- Bouton X pour fermer
- Navigation prev/next si plusieurs images
- Clic sur l'overlay = fermer

✅ VALIDATION :
- Ouvrir une tâche → section Images visible
- Drag & drop une image → preview → upload → miniature apparaît
- Cliquer la miniature → lightbox s'ouvre
- Navigation prev/next entre images
- Supprimer une image → disparaît
- Tenter d'uploader un PDF → erreur "Type non autorisé"
- Tenter d'uploader > 5MB → erreur "Image trop lourde"
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 18 — WEBHOOKS & AUTOMATISATION
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle presque complet.
Je dois ajouter les webhooks pour connecter avec Make, Zapier, n8n.

TÂCHE : Crée le système de webhooks.

1. Dans Supabase → Functions → Créer la fonction "webhook-dispatcher" :
[Copier exactement le code du TDD section 12]
Déployer : supabase functions deploy webhook-dispatcher

2. Crée src/services/webhook.service.ts :
- triggerWebhook(taskId, eventType, webhookUrl) : appelle l'Edge Function
- Événements : task_created | task_completed | task_overdue | task_rescheduled

3. Dans les actions de tasks.store.ts, ajouter les appels webhook :
- Après createTask() → triggerWebhook(task.id, 'task_created', task.webhookUrl)
- Après complétion → triggerWebhook(task.id, 'task_completed', task.webhookUrl)

4. Crée src/views/SettingsView.vue → onglet "Automatisation" :
- Champ URL webhook global (toutes les tâches)
- Bouton "Tester" → envoie un payload test
- Section logs : 10 derniers appels webhook avec statut ✅/❌

5. Validation URL webhook (isValidWebhookUrl de SECURITY.md)

PAYLOAD envoyé au webhook :
{
  "event": "task_completed",
  "timestamp": "2025-01-15T10:30:00Z",
  "app": "UrsUle",
  "task": {
    "id": "uuid",
    "title": "Ma tâche",
    "status": "done",
    "priority": "urgent",
    "deadline": "2025-01-15",
    "category": "Travail",
    "appreciation": "happy",
    "duration_minutes": 45
  }
}

✅ VALIDATION :
- Configurer webhook URL (ex: webhook.site pour test)
- Compléter une tâche → requête POST reçue sur webhook.site
- Payload JSON correct avec les données de la tâche
- Tester avec URL invalide → erreur affichée
- Logs : voir le dernier appel avec statut 200
```

---

## ═══════════════════════════════════════
## 🟦 FEATURE 19 — DÉPLOIEMENT VERCEL FINAL
## ═══════════════════════════════════════

```
CONTEXTE : Projet UrsUle complet en local.
Je dois le déployer en production sur Vercel.

TÂCHE : Déploiement production complet.

1. Crée vercel.json à la racine :
[Copier le contenu de SECURITY.md section 2, A05 — headers HTTP]

2. Dans Vercel Dashboard → Environment Variables → Ajouter :
VITE_SUPABASE_URL = (ta valeur)
VITE_SUPABASE_ANON_KEY = (ta valeur)
VITE_APP_NAME = UrsUle
VITE_AES_SECRET = (32 caractères aléatoires)

3. Dans Supabase → Auth → URL Configuration :
- Site URL : https://ursule.vercel.app
- Redirect URLs : https://ursule.vercel.app/**

4. Build et déploiement :
npm run build  # Vérifier 0 erreur
git add -A && git commit -m "feat: UrsUle MVP V1 complet"
git push origin main
# Vercel déploie automatiquement

5. Tests post-déploiement :
- https://ursule.vercel.app → page de connexion s'affiche
- Créer un compte → email reçu
- Se connecter → dashboard fonctionnel
- Créer une tâche → sauvegardée
- Vérifier les headers HTTP : curl -I https://ursule.vercel.app

6. Audit sécurité :
npx lighthouse https://ursule.vercel.app --only-categories=performance,best-practices,accessibility

✅ VALIDATION FINALE :
- App en ligne sur Vercel
- Authentification fonctionnelle en production
- CRUD tâches fonctionnel
- Headers de sécurité présents (X-Frame-Options: DENY, etc.)
- Lighthouse Best Practices > 80
- Aucune erreur dans la console navigateur
```

---

## 📋 CHECKLIST FINALE MVP V1

| Feature | Status | Validé |
|---|---|---|
| 0. Setup projet | ✅ | ✅ |
| 1. Base de données | ✅ | ✅ |
| 2. Client Supabase & Types | ✅ | ✅ |
| 3. Authentification | ✅ | ✅ |
| 4. Layout principal | ✅ | ✅ |
| 5. CRUD Tâches | ✅ | ✅ |
| 6. Vues d'affichage | ✅ | ✅ |
| 7. Éditeur riche (Tiptap) | ✅ | ✅ |
| 8. Timer & Chronomètre | ✅ | ✅ |
| 9. Validation gamifiée | ✅ | ✅ |
| 10. Appréciation post-tâche | ✅ | ✅ |
| 11. Projets | ✅ | ✅ |
| 12. Dashboard complet | ✅ | ✅ |
| 13. Statistiques | ✅ | ✅ |
| 14. Export PDF/Excel | ✅ | ✅ |
| 15. Vue Calendrier | ✅ | ✅ |
| 16. Sous-tâches | ✅ | ✅ |
| 17. Images | ✅ | ✅ |
| 18. Webhooks | ✅ | ✅ |
| 19. Déploiement Vercel | ✅ | ✅ |

---
*MVP V1 UrsUle — Guide Feature by Feature — Krsidoine 2026*
