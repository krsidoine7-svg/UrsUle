# 🎨 DESIGN SYSTEM — UrsUle
**Palette : Bleu · Blanc · Vert Forêt**  
**Stack : Tailwind CSS + shadcn-vue + Lucide Vue**

---

## 1. PALETTE DE COULEURS

### 1.1 Couleurs Primaires
```css
/* tailwind.config.ts → extend.colors */

:root {
  /* Bleu principal */
  --color-primary-50:  #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;  /* PRIMARY - boutons, accents */
  --color-primary-600: #2563EB;  /* PRIMARY HOVER */
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;

  /* Vert Forêt */
  --color-forest-50:  #F0FDF4;
  --color-forest-100: #DCFCE7;
  --color-forest-200: #BBF7D0;
  --color-forest-300: #86EFAC;
  --color-forest-400: #4ADE80;
  --color-forest-500: #22C55E;
  --color-forest-600: #16A34A;  /* FOREST - succès, validation */
  --color-forest-700: #15803D;
  --color-forest-800: #166534;
  --color-forest-900: #14532D;

  /* Neutres (Blanc → Gris) */
  --color-neutral-0:   #FFFFFF;
  --color-neutral-50:  #F8FAFC;  /* Fond app */
  --color-neutral-100: #F1F5F9;  /* Fond cartes */
  --color-neutral-200: #E2E8F0;  /* Bordures légères */
  --color-neutral-300: #CBD5E1;  /* Bordures */
  --color-neutral-400: #94A3B8;  /* Texte désactivé */
  --color-neutral-500: #64748B;  /* Texte secondaire */
  --color-neutral-600: #475569;  /* Texte corps */
  --color-neutral-700: #334155;  /* Texte fort */
  --color-neutral-800: #1E293B;  /* Texte titre */
  --color-neutral-900: #0F172A;  /* Texte noir */

  /* États */
  --color-danger:   #EF4444;  /* Erreur, urgence, suppression */
  --color-warning:  #F59E0B;  /* Avertissement, priorité haute */
  --color-info:     #3B82F6;  /* Information */
  --color-success:  #16A34A;  /* Succès, complété */
}
```

### 1.2 Mapping Sémantique
```css
/* Couleurs par usage */
--bg-app:           var(--color-neutral-50);    /* Fond général */
--bg-sidebar:       var(--color-neutral-0);     /* Fond sidebar */
--bg-card:          var(--color-neutral-0);     /* Fond des cards */
--bg-card-hover:    var(--color-neutral-50);
--bg-overlay:       rgba(15, 23, 42, 0.5);      /* Modals */

--text-primary:     var(--color-neutral-800);   /* Titres */
--text-secondary:   var(--color-neutral-500);   /* Sous-titres */
--text-disabled:    var(--color-neutral-400);
--text-inverse:     var(--color-neutral-0);     /* Sur fond sombre */

--border-light:     var(--color-neutral-200);
--border-medium:    var(--color-neutral-300);
--border-focus:     var(--color-primary-500);

--brand-primary:    var(--color-primary-600);
--brand-secondary:  var(--color-forest-600);
```

### 1.3 Couleurs par Statut de Tâche
```css
.status-todo        { --status-bg: #F1F5F9; --status-text: #475569; }
.status-in-progress { --status-bg: #DBEAFE; --status-text: #1D4ED8; }
.status-done        { --status-bg: #DCFCE7; --status-text: #15803D; }
.status-archived    { --status-bg: #F1F5F9; --status-text: #94A3B8; }
.status-rescheduled { --status-bg: #FEF3C7; --status-text: #B45309; }
.status-to-redo     { --status-bg: #FEE2E2; --status-text: #DC2626; }
```

### 1.4 Couleurs par Priorité
```css
.priority-low    { --priority-color: #94A3B8; }  /* Gris */
.priority-normal { --priority-color: #3B82F6; }  /* Bleu */
.priority-high   { --priority-color: #F59E0B; }  /* Orange */
.priority-urgent { --priority-color: #EF4444; }  /* Rouge */
```

---

## 2. TYPOGRAPHIE

### 2.1 Polices
```css
/* Google Fonts — Ajouter dans index.html */
/* Titre : Sora (moderne, géométrique, personnalité) */
/* Corps : Inter (lisibilité, professionnel) */
/* Code : JetBrains Mono */

@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

```typescript
// tailwind.config.ts
fontFamily: {
  display: ['Sora', 'sans-serif'],    // Titres, logo, chiffres stats
  body:    ['Inter', 'sans-serif'],   // Corps de texte, labels
  mono:    ['JetBrains Mono', 'monospace'],  // Code, timers
}
```

### 2.2 Échelle Typographique
```css
/* Taille base : 16px (1rem) */

.text-xs    { font-size: 0.75rem;  line-height: 1rem;    }  /* 12px - labels, badges */
.text-sm    { font-size: 0.875rem; line-height: 1.25rem; }  /* 14px - corps secondaire */
.text-base  { font-size: 1rem;     line-height: 1.5rem;  }  /* 16px - corps principal */
.text-lg    { font-size: 1.125rem; line-height: 1.75rem; }  /* 18px - titres section */
.text-xl    { font-size: 1.25rem;  line-height: 1.75rem; }  /* 20px - titres carte */
.text-2xl   { font-size: 1.5rem;   line-height: 2rem;    }  /* 24px - titres page */
.text-3xl   { font-size: 1.875rem; line-height: 2.25rem; }  /* 30px - titre dashboard */
.text-4xl   { font-size: 2.25rem;  line-height: 2.5rem;  }  /* 36px - chiffres stats */

/* Poids */
.font-normal   { font-weight: 400; }
.font-medium   { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold     { font-weight: 700; }
.font-extrabold { font-weight: 800; }
```

### 2.3 Tokens Typographiques (Usage)
```
Logo UrsUle:    font-display, text-2xl, font-extrabold, color: primary-600
Titre H1 page:  font-display, text-2xl, font-bold, text-neutral-800
Titre section:  font-display, text-xl, font-semibold, text-neutral-700
Titre carte:    font-body, text-base, font-semibold, text-neutral-800
Corps texte:    font-body, text-sm, font-normal, text-neutral-600
Label:          font-body, text-xs, font-medium, text-neutral-500 (uppercase)
Badge:          font-body, text-xs, font-semibold
Chiffre stat:   font-display, text-4xl, font-bold, text-primary-600
Timer:          font-mono, text-3xl, font-bold, text-neutral-800
```

---

## 3. ESPACEMENT

```css
/* Échelle Tailwind étendue */
/* Base : 4px = 1 unité */

space-1:  4px   /* Espacement micro (entre icône et texte) */
space-2:  8px   /* Espacement petit (padding badge) */
space-3:  12px  /* Espacement badge et labels */
space-4:  16px  /* Espacement standard */
space-5:  20px  /* Espacement section */
space-6:  24px  /* Padding carte */
space-8:  32px  /* Espacement section majeure */
space-10: 40px  /* Padding page */
space-12: 48px  /* Espacement large */
space-16: 64px  /* Espacement xl */
```

---

## 4. COMPOSANTS UI

### 4.1 Boutons
```vue
<!-- Variants des boutons (shadcn-vue Button) -->

<!-- Primary : action principale -->
<Button variant="default" class="bg-primary-600 hover:bg-primary-700 text-white font-semibold">
  Créer une tâche
</Button>

<!-- Secondary : action secondaire -->
<Button variant="outline" class="border-neutral-300 text-neutral-700 hover:bg-neutral-50">
  Annuler
</Button>

<!-- Danger : suppression -->
<Button variant="destructive" class="bg-danger hover:bg-red-600 text-white">
  Supprimer
</Button>

<!-- Ghost : action tertiaire -->
<Button variant="ghost" class="text-neutral-600 hover:bg-neutral-100">
  Voir plus
</Button>

<!-- Icon only -->
<Button variant="ghost" size="icon">
  <Plus class="h-4 w-4" />
</Button>
```

### 4.2 Badges Statut
```vue
<!-- src/components/common/StatusBadge.vue -->
<template>
  <span :class="[
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
    statusClasses[status]
  ]">
    {{ statusLabels[status] }}
  </span>
</template>

<script setup lang="ts">
const statusClasses = {
  todo:        'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done:        'bg-green-100 text-green-700',
  archived:    'bg-neutral-100 text-neutral-400',
  rescheduled: 'bg-yellow-100 text-yellow-700',
  to_redo:     'bg-red-100 text-red-700',
}
const statusLabels = {
  todo:        'À faire',
  in_progress: 'En cours',
  done:        'Terminé',
  archived:    'Archivé',
  rescheduled: 'Reporté',
  to_redo:     'À reprendre',
}
</script>
```

### 4.3 Badges Priorité
```vue
<!-- src/components/common/PriorityBadge.vue -->
<template>
  <span :class="['inline-flex items-center gap-1 text-xs font-medium', priorityConfig[priority].class]">
    <component :is="priorityConfig[priority].icon" class="h-3 w-3" />
    {{ priorityConfig[priority].label }}
  </span>
</template>

<script setup lang="ts">
import { ArrowDown, Minus, ArrowUp, Flame } from 'lucide-vue-next'

const priorityConfig = {
  low:    { class: 'text-neutral-400', icon: ArrowDown, label: 'Faible' },
  normal: { class: 'text-blue-600',    icon: Minus,     label: 'Normale' },
  high:   { class: 'text-amber-600',   icon: ArrowUp,   label: 'Haute' },
  urgent: { class: 'text-red-600',     icon: Flame,     label: 'Urgente' },
}
</script>
```

### 4.4 TaskCard
```vue
<!-- src/components/tasks/TaskCard.vue -->
<!-- Composant carte réutilisable pour Grid et Kanban -->
<template>
  <div 
    :class="[
      'bg-white rounded-xl border border-neutral-200 p-4 hover:border-primary-300 hover:shadow-md',
      'transition-all duration-200 cursor-pointer group',
      task.is_pinned && 'border-l-4 border-l-amber-400',
      task.color && `border-l-4`,
    ]"
    :style="task.color ? { borderLeftColor: task.color } : {}"
    @click="$emit('click', task)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <span class="text-sm font-semibold text-neutral-800 line-clamp-2 flex-1">
        {{ task.title }}
      </span>
      <Pin v-if="task.is_pinned" class="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" />
    </div>

    <!-- Badges -->
    <div class="flex flex-wrap items-center gap-1.5 mb-3">
      <StatusBadge :status="task.status" />
      <PriorityBadge :priority="task.priority" />
      <CategoryBadge v-if="task.category" :category="task.category" />
    </div>

    <!-- Métadonnées -->
    <div class="flex items-center gap-3 text-xs text-neutral-400">
      <span v-if="task.deadline" :class="isOverdue(task.deadline) && 'text-red-500'">
        <Calendar class="h-3 w-3 inline mr-1" />
        {{ formatDate(task.deadline) }}
      </span>
      <span v-if="task.subtasks?.length">
        <CheckSquare class="h-3 w-3 inline mr-1" />
        {{ task.subtasks.filter(s => s.status === 'done').length }}/{{ task.subtasks.length }}
      </span>
      <span v-if="task.appreciation">
        {{ appreciationEmoji[task.appreciation] }}
      </span>
    </div>
  </div>
</template>
```

### 4.5 Sidebar Navigation
```vue
<!-- src/components/common/AppSidebar.vue -->
<!-- Navigation latérale avec items actifs -->
<template>
  <aside :class="[
    'fixed left-0 top-0 h-full bg-white border-r border-neutral-200 z-40',
    'transition-all duration-300',
    collapsed ? 'w-16' : 'w-64'
  ]">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 py-5 border-b border-neutral-100">
      <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="text-white font-extrabold font-display text-sm">U</span>
      </div>
      <span v-if="!collapsed" class="font-display font-extrabold text-primary-600 text-lg">
        UrsUle
      </span>
    </div>

    <!-- Navigation -->
    <nav class="p-3 space-y-1">
      <NavItem v-for="item in navItems" :key="item.path"
        :to="item.path" :icon="item.icon" :label="item.label"
        :collapsed="collapsed"
      />
    </nav>

    <!-- Profil en bas -->
    <div class="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-100">
      <UserAvatarMenu :collapsed="collapsed" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, CheckSquare, FolderOpen, Calendar, BarChart2, Settings } from 'lucide-vue-next'

const navItems = [
  { path: '/',         icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/tasks',    icon: CheckSquare,     label: 'Mes tâches' },
  { path: '/projects', icon: FolderOpen,      label: 'Projets' },
  { path: '/calendar', icon: Calendar,        label: 'Calendrier' },
  { path: '/stats',    icon: BarChart2,       label: 'Statistiques' },
  { path: '/settings', icon: Settings,        label: 'Paramètres' },
]
</script>
```

---

## 5. ICÔNES (Lucide Vue)

### 5.1 Mapping des Icônes par Usage
```typescript
// src/utils/icons.ts — Mapping sémantique des icônes

export const Icons = {
  // Navigation
  dashboard:   'LayoutDashboard',
  tasks:       'CheckSquare',
  projects:    'FolderOpen',
  calendar:    'Calendar',
  stats:       'BarChart2',
  settings:    'Settings',

  // Actions
  add:         'Plus',
  edit:        'Pencil',
  delete:      'Trash2',
  save:        'Save',
  duplicate:   'Copy',
  pin:         'Pin',
  archive:     'Archive',
  export:      'Download',
  upload:      'Upload',
  search:      'Search',
  filter:      'Filter',
  sort:        'ArrowUpDown',

  // Statuts
  todo:        'Circle',
  inProgress:  'PlayCircle',
  done:        'CheckCircle',
  archived:    'Archive',
  rescheduled: 'RotateCcw',
  toRedo:      'AlertCircle',

  // Priorités
  low:         'ArrowDown',
  normal:      'Minus',
  high:        'ArrowUp',
  urgent:      'Flame',

  // Features
  timer:       'Timer',
  stopwatch:   'Stopwatch',
  notification: 'Bell',
  tag:         'Tag',
  category:    'Folder',
  image:       'Image',
  link:        'Link',
  webhook:     'Webhook',
  validation:  'ShieldCheck',
  mood:        'Smile',
  recurrence:  'RefreshCw',
  deadline:    'CalendarClock',
  subtask:     'GitBranch',
  comment:     'MessageSquare',
  project:     'Briefcase',
}
```

---

## 6. LAYOUT & GRILLES

### 6.1 Layout Principal
```
┌─────────────────────────────────────────────┐
│  SIDEBAR (w-64)  │  MAIN CONTENT (flex-1)   │
│  fixe, h-full    │  ├── HEADER (h-16)        │
│                  │  └── PAGE (overflow-auto) │
│                  │       ├── PAGE HEADER     │
│                  │       ├── FILTERS BAR     │
│                  │       └── CONTENT AREA    │
└─────────────────────────────────────────────┘
```

```css
/* Layout principal */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar { width: 256px; flex-shrink: 0; }
.sidebar.collapsed { width: 64px; }

.main-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.page-content {
  padding: 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
```

### 6.2 Grilles Responsives
```css
/* Vue Grille des tâches */
.tasks-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(1, 1fr);    /* Mobile */
}

@media (min-width: 768px) {
  .tasks-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .tasks-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1280px) {
  .tasks-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 7. ANIMATIONS & TRANSITIONS

```css
/* tailwind.config.ts → extend.animation */

/* Apparition carte */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide depuis la droite (slide-over panel) */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

/* Pulse doux pour les notifications */
@keyframes gentlePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

/* Shake sur erreur validation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-4px); }
  75%       { transform: translateX(4px); }
}

/* Classes Tailwind */
.animate-fade-in-up   { animation: fadeInUp 0.2s ease-out; }
.animate-slide-right  { animation: slideInRight 0.3s ease-out; }
.animate-gentle-pulse { animation: gentlePulse 2s infinite; }
.animate-shake        { animation: shake 0.3s ease-in-out; }
```

---

## 8. CONFIGURATION TAILWIND COMPLÈTE

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
    './node_modules/shadcn-vue/**/*.{js,vue,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E40AF', 900: '#1E3A8A', DEFAULT: '#2563EB',
        },
        forest: {
          50:  '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
          400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
          800: '#166534', 900: '#14532D', DEFAULT: '#16A34A',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        sans:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        'modal': '0 20px 60px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in-up':    'fadeInUp 0.2s ease-out',
        'slide-right':   'slideInRight 0.3s ease-out',
        'gentle-pulse':  'gentlePulse 2s infinite',
        'shake':         'shake 0.3s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        gentlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
} satisfies Config
```

---

## 9. COMPOSANTS shadcn-vue UTILISÉS

### Installation
```bash
npx shadcn-vue@latest init
```

### Composants à installer
```bash
npx shadcn-vue@latest add button
npx shadcn-vue@latest add input
npx shadcn-vue@latest add textarea
npx shadcn-vue@latest add select
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add sheet         # Slide-over
npx shadcn-vue@latest add dropdown-menu
npx shadcn-vue@latest add popover
npx shadcn-vue@latest add calendar      # Date picker
npx shadcn-vue@latest add badge
npx shadcn-vue@latest add card
npx shadcn-vue@latest add tabs
npx shadcn-vue@latest add toggle-group
npx shadcn-vue@latest add progress
npx shadcn-vue@latest add separator
npx shadcn-vue@latest add tooltip
npx shadcn-vue@latest add avatar
npx shadcn-vue@latest add checkbox
npx shadcn-vue@latest add switch
npx shadcn-vue@latest add label
npx shadcn-vue@latest add alert
npx shadcn-vue@latest add skeleton
```

---

## 10. DESIGN DES APPRÉCIATION EMOJIS

```typescript
// Mapping complet des appréciations
export const APPRECIATIONS = [
  { key: 'happy',           emoji: '😊', label: 'Content / Satisfait',    color: '#22C55E' },
  { key: 'super_productive', emoji: '🚀', label: 'Super productif !',      color: '#3B82F6' },
  { key: 'enriching',      emoji: '💡', label: 'Très enrichissant',      color: '#F59E0B' },
  { key: 'neutral',        emoji: '😐', label: 'Neutre',                  color: '#94A3B8' },
  { key: 'too_hard',       emoji: '😤', label: 'Trop difficile',          color: '#EF4444' },
  { key: 'stressful',      emoji: '😰', label: 'Stressant',              color: '#F97316' },
  { key: 'boring',         emoji: '😴', label: 'Ennuyeux',               color: '#8B5CF6' },
  { key: 'nothing_learned', emoji: '🤔', label: 'Rien appris',            color: '#64748B' },
]
```

---

## 11. LOGO & BRANDING

```vue
<!-- Logo UrsUle — composant SVG inline -->
<template>
  <div class="flex items-center gap-2.5">
    <!-- Icône : U stylisé dans un carré arrondi bleu -->
    <div class="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl
                flex items-center justify-center shadow-sm">
      <span class="font-display font-extrabold text-white text-lg leading-none">U</span>
    </div>
    <!-- Nom -->
    <div class="flex flex-col leading-none">
      <span class="font-display font-extrabold text-xl text-primary-700">UrsUle</span>
      <span class="text-xs text-neutral-400 font-body">Mon agenda intelligent</span>
    </div>
  </div>
</template>
```

---
*Design System — Document de référence pour tous les composants UrsUle*
