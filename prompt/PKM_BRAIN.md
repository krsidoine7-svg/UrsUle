# 🧠 UrsUle Brain — Module PKM (Personal Knowledge Management)
## PRD + TDD + MVP Feature by Feature
**Nom du module :** UrsUle Brain  
**Intégré dans :** UrsUle (même app, nouvel onglet sidebar)  
**Inspiré de :** Obsidian + Logseq + RemNote  
**Version cible :** V2 (après MVP V1 des tâches)

---

## 🧠 C'EST QUOI URSULE BRAIN ?

> UrsUle Brain = Obsidian + RemNote + Logseq, **intégré directement dans UrsUle**, avec les tâches, projets et statistiques connectés à tes notes.

**Ce que ça change pour toi :**
- Tu termines un projet → UrsUle Brain te pose 5 questions dessus pour ancrer l'apprentissage
- Tu crées une note "Vue 3" → elle se lie automatiquement à ta tâche "Apprendre Vue 3"
- Tu révises tes flashcards le matin → UrsUle te dit "Tu as appris 12 concepts cette semaine"
- Tu ouvres le graphe → tu vois visuellement comment toutes tes idées sont connectées

---

## 📐 ARCHITECTURE DU MODULE

```
UrsUle (App principale)
├── 📋 Tâches (MVP V1)
├── 📁 Projets (MVP V1)
├── 📊 Statistiques (MVP V1)
└── 🧠 Brain (V2 — CE MODULE)
    ├── 📝 Notes (CRUD Markdown)
    ├── 📂 Dossiers / Sous-dossiers
    ├── 🔗 Liens bidirectionnels [[note]]
    ├── 🕸️ Graphe visuel (D3.js)
    ├── 🃏 Flashcards (algo SM-2)
    ├── 🗺️ Mind Maps
    ├── 📅 Journal quotidien
    ├── ❓ Quiz actifs (fin tâche/projet)
    ├── 📊 Stats séparées PKM
    └── 🔒 Partage avec permissions
```

---

## 🗃️ SCHÉMA DE BASE DE DONNÉES

```sql
-- ═══ TABLE : notes ═══
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',            -- Markdown brut
  content_json JSONB,                 -- Tiptap JSON (rendu)
  slug TEXT,                          -- URL-friendly title pour les liens [[slug]]
  is_journal BOOLEAN DEFAULT FALSE,   -- Note de journal quotidien
  journal_date DATE,                  -- Date du journal si is_journal=true
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  icon TEXT,
  word_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 0,
  -- Liens vers l'écosystème UrsUle
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  -- Partage
  share_token TEXT UNIQUE,
  share_permission TEXT DEFAULT 'none' CHECK (share_permission IN ('none','read','comment','write')),
  shared_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_notes_slug_user ON notes(user_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_folder ON notes(folder_id);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
-- Recherche plein texte
CREATE INDEX idx_notes_fts ON notes USING GIN(to_tsvector('french', title || ' ' || content));

-- ═══ TABLE : note_folders ═══
CREATE TABLE note_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,  -- Sous-dossiers
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ TABLE : note_links (liens bidirectionnels) ═══
CREATE TABLE note_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  context TEXT,                        -- Extrait de la phrase où le lien apparaît
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_note_id, target_note_id)
);

-- ═══ TABLE : flashcards ═══
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  deck_name TEXT DEFAULT 'Général',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  card_type TEXT DEFAULT 'qa' CHECK (card_type IN ('qa','truefalse','cloze','image')),
  -- Algorithme SM-2 (répétition espacée)
  repetitions INTEGER DEFAULT 0,       -- Nombre de fois révisée
  ease_factor DECIMAL(4,2) DEFAULT 2.5,-- Facteur de facilité (2.5 = normal)
  interval_days INTEGER DEFAULT 1,     -- Prochain intervalle en jours
  due_date DATE DEFAULT CURRENT_DATE,  -- Prochaine révision
  last_reviewed_at TIMESTAMPTZ,
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flashcards_due ON flashcards(user_id, due_date);

-- ═══ TABLE : flashcard_reviews (historique) ═══
CREATE TABLE flashcard_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 0 AND 5),  -- 0=bloqué, 3=correct, 5=facile
  time_taken_seconds INTEGER,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ TABLE : mind_maps ═══
CREATE TABLE mind_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  nodes JSONB DEFAULT '[]',            -- [{id, label, x, y, color, parent_id}]
  edges JSONB DEFAULT '[]',            -- [{source, target, label}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ TABLE : note_quizzes (quiz actifs fin tâche/projet) ═══
CREATE TABLE note_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  trigger TEXT DEFAULT 'manual' CHECK (trigger IN ('task_complete','project_complete','manual','scheduled')),
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'open' CHECK (question_type IN ('truefalse','calc','open','choice','timer')),
  correct_answer TEXT,
  choices JSONB,                       -- Pour question_type='choice'
  time_limit_seconds INTEGER,          -- Pour question_type='timer'
  is_answered BOOLEAN DEFAULT FALSE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- ═══ TABLE : note_shares ═══
CREATE TABLE note_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  shared_with_email TEXT,              -- null = partage par lien public
  permission TEXT DEFAULT 'read' CHECK (permission IN ('read','comment','write')),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ RLS ═══
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- Policies : accès uniquement à ses propres données
CREATE POLICY "notes_own" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "folders_own" ON note_folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "links_own" ON note_links FOR ALL USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_links.source_note_id AND notes.user_id = auth.uid())
);
CREATE POLICY "flashcards_own" ON flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reviews_own" ON flashcard_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mindmaps_own" ON mind_maps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "quizzes_own" ON note_quizzes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "shares_own" ON note_shares FOR ALL USING (auth.uid() = owner_id);

-- Accès aux notes partagées (lecture publique via token)
CREATE POLICY "notes_shared_read" ON notes FOR SELECT USING (
  share_permission != 'none' AND share_token IS NOT NULL
);
```

---

## 📁 STRUCTURE DES FICHIERS À CRÉER

```
src/
├── views/
│   └── brain/
│       ├── BrainView.vue          # Layout principal Brain
│       ├── NoteEditorView.vue     # Éditeur pleine page
│       ├── GraphView.vue          # Graphe visuel
│       ├── FlashcardsView.vue     # Session de révision
│       ├── MindMapView.vue        # Mind map
│       └── JournalView.vue        # Journal quotidien
├── components/
│   └── brain/
│       ├── layout/
│       │   ├── BrainSidebar.vue   # Sidebar avec dossiers
│       │   └── BrainHeader.vue    # Barre d'outils Brain
│       ├── notes/
│       │   ├── NoteCard.vue       # Card dans la liste
│       │   ├── NoteEditor.vue     # Éditeur Tiptap étendu
│       │   ├── NoteList.vue       # Liste des notes
│       │   ├── FolderTree.vue     # Arbre de dossiers
│       │   ├── TagCloud.vue       # Nuage de tags
│       │   ├── BacklinkPanel.vue  # Panneau backlinks
│       │   └── LinkSuggestion.vue # Suggestions [[liens]]
│       ├── graph/
│       │   └── KnowledgeGraph.vue # Graphe D3.js
│       ├── flashcards/
│       │   ├── FlashcardDeck.vue  # Vue deck
│       │   ├── FlashcardReview.vue# Session révision
│       │   └── FlashcardCreate.vue# Création card
│       ├── mindmap/
│       │   └── MindMapCanvas.vue  # Canvas mind map
│       ├── quiz/
│       │   ├── QuizDialog.vue     # Dialog quiz actif
│       │   └── QuizTimer.vue      # Chrono pour quiz
│       └── stats/
│           └── BrainStats.vue     # Stats PKM séparées
├── stores/
│   ├── notes.store.ts
│   ├── folders.store.ts
│   ├── flashcards.store.ts
│   └── brain-stats.store.ts
├── services/
│   ├── notes.service.ts
│   ├── links.service.ts           # Gestion liens bidirectionnels
│   ├── flashcards.service.ts
│   ├── sm2.service.ts             # Algorithme SM-2
│   └── mindmap.service.ts
└── composables/
    ├── useNoteEditor.ts           # Logique éditeur
    ├── useNoteLinks.ts            # Parsing [[liens]]
    ├── useFlashcardReview.ts      # Session de révision
    └── useQuiz.ts                 # Logique quiz actif
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F01 — SETUP DB + NAVIGATION
## ═══════════════════════════════════════════

```
CONTEXTE : Projet UrsUle — MVP V1 terminé et déployé.
Je dois ajouter le module UrsUle Brain (PKM) comme un nouvel onglet.

TÂCHE : Crée la base de données et la navigation pour UrsUle Brain.

1. Exécute le SQL complet ci-dessus dans Supabase (toutes les tables Brain)

2. Dans le Router (src/router/index.ts), ajoute les routes :
{
  path: '/brain',
  component: () => import('@/views/brain/BrainView.vue'),
  meta: { requiresAuth: true },
  children: [
    { path: '', redirect: '/brain/notes' },
    { path: 'notes', component: () => import('@/views/brain/NoteListView.vue') },
    { path: 'notes/:id', component: () => import('@/views/brain/NoteEditorView.vue') },
    { path: 'graph', component: () => import('@/views/brain/GraphView.vue') },
    { path: 'flashcards', component: () => import('@/views/brain/FlashcardsView.vue') },
    { path: 'mindmap', component: () => import('@/views/brain/MindMapView.vue') },
    { path: 'journal', component: () => import('@/views/brain/JournalView.vue') },
  ]
}

3. Dans AppSidebar.vue, ajoute le lien "Brain" avec l'icône Brain (Lucide) :
{ path: '/brain', icon: Brain, label: 'UrsUle Brain' }
→ Le placer entre "Projets" et "Calendrier"

4. Crée src/views/brain/BrainView.vue :
- Layout à 3 colonnes :
  • Colonne 1 (240px) : FolderTree + TagCloud + bouton "Nouvelle note"
  • Colonne 2 (flex-1) : Liste des notes ou éditeur
  • Colonne 3 (280px) : Backlinks + Info note (collapsible)
- Barre d'outils top : Recherche | Vue (liste/grille) | Tri | Filtre tags
- Switcher en haut à droite : Notes | Graphe | Flashcards | MindMap | Journal

5. Crée src/stores/notes.store.ts :
- notes: Note[]
- activeNote: Note | null
- selectedFolder: string | null
- searchQuery: string
- CRUD : fetchNotes, createNote, updateNote, deleteNote
- setActiveNote(id)

6. Crée src/services/notes.service.ts :
- getAll(folderId?, tags?, search?) → requête Supabase avec full-text search
- getById(id) → avec backlinks joints
- create(dto) → génère le slug depuis le titre (title → 'mon-titre')
- update(id, dto) → met à jour word_count et read_time
- softDelete(id)
- getBySlug(slug) → pour les liens [[slug]]

STYLE :
- Sidebar Brain : bg-neutral-900 (mode sombre), texte blanc — ambiance "éditeur de code"
- Ou mode clair cohérent avec UrsUle — laisser le choix dans les paramètres
- Transitions fluides entre les vues

✅ VALIDATION :
- Cliquer "Brain" dans la sidebar → la vue Brain s'affiche
- 3 colonnes visibles (dossiers | notes | info)
- Table "notes" existe dans Supabase
- Créer une note basique (titre seulement) → sauvegardée en DB
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F02 — ÉDITEUR MARKDOWN AVANCÉ
## ═══════════════════════════════════════════

```
CONTEXTE : Navigation Brain prête. Je dois créer l'éditeur Markdown avancé.
L'éditeur doit supporter : Markdown, liens [[note]], tags #tag, titres, listes, etc.

TÂCHE : Crée l'éditeur de notes complet.

DÉPENDANCES SUPPLÉMENTAIRES :
npm install @tiptap/extension-mention @tiptap/extension-code-block-lowlight
npm install lowlight        (coloration syntaxique du code)
npm install fuse.js         (recherche fuzzy pour suggestions de liens)

1. Crée src/components/brain/notes/NoteEditor.vue :

TOOLBAR BRAIN (différente de la toolbar tâches) :
┌─────────────────────────────────────────────────────────────┐
│ H1 │ H2 │ H3 │ B │ I │ S │ │ • │ 1. │ ☑ │ │ {} │ ── │ 🔗 │ [[]] │ #tag │
└─────────────────────────────────────────────────────────────┘

EXTENSIONS TIPTAP À CONFIGURER :
- StarterKit (H1/H2/H3, bold, italic, strike, listes, blockquote, code)
- TaskList + TaskItem (checklist cliquable)
- CodeBlockLowlight (code avec coloration : js, python, sql, bash)
- Link (liens hypertexte classiques)
- Mention (pour les liens [[note]] — voir point 3)
- Table (tableaux Markdown)
- Image (images dans les notes)
- Placeholder : "Commence à écrire... utilise [[ pour lier une note, # pour un tag"

2. MODE ÉDITEUR (Toggle en haut à droite) :
- WYSIWYG (rendu en temps réel — mode par défaut)
- Markdown source (textarea avec le code Markdown brut)
- Split view (WYSIWYG gauche | Markdown droite)

3. LIENS [[note]] — Extension Mention personnalisée :
Quand l'utilisateur tape [[ → afficher un dropdown de suggestions :
- Recherche dans les titres des notes existantes (fuse.js)
- Flèche haut/bas pour naviguer, Entrée pour insérer
- Format inséré : [[slug-de-la-note|Titre affiché]]
- La note liée reçoit un backlink automatique (on l'enregistre dans note_links)
- En lecture : le lien est cliquable → ouvre la note cible

PARSER de liens à la sauvegarde (src/composables/useNoteLinks.ts) :
function extractLinks(content: string): string[] {
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  // Retourne la liste des slugs trouvés
}
async function syncLinks(noteId: string, content: string) {
  const slugs = extractLinks(content)
  // Supprimer les anciens liens de cette note
  // Insérer les nouveaux dans note_links
  // → Supabase upsert
}

4. TAGS #tag :
- Taper #motclé dans le contenu → mis en évidence visuellement (badge bleu inline)
- Extraction automatique des tags à la sauvegarde
- Mise à jour du champ tags[] dans la note

5. SAUVEGARDE AUTO :
- Debounce 1 seconde après chaque frappe
- Indicateur : "Sauvegardé il y a 2s" | "Sauvegarde..." | "Non sauvegardé"
- Calcul word_count et read_time_minutes à chaque save
  • read_time = Math.ceil(wordCount / 200) minutes

6. HEADER DE NOTE :
- Titre en grand (input H1, placeholder "Titre de la note")
- Sous le titre : Date de création | Temps de lecture | Tags | Dossier
- Icône emoji (picker) | Couleur de couverture optionnelle
- Bouton "Lier à une tâche/projet" (select dropdown)
- Bouton "Créer flashcard depuis cette note"
- Bouton "Partager" | Bouton "Exporter .md"

7. Exporter une note en .md :
function exportToMarkdown(note: Note) {
  const frontmatter = [
    '---',
    `title: "${note.title}"`,
    `date: ${note.created_at}`,
    `tags: [${note.tags.join(', ')}]`,
    '---',
    ''
  ].join('\n')
  const blob = new Blob([frontmatter + note.content], { type: 'text/markdown' })
  // Télécharger : nom-de-note.md
}

✅ VALIDATION :
- Écrire "# Mon titre" → rendu comme H1
- Taper [[ → dropdown de suggestions de notes → sélectionner → lien créé
- Taper #javascript → tag reconnu et mis en évidence
- Attendre 1s → "Sauvegardé il y a 1s" apparaît
- Cliquer "Exporter .md" → fichier mon-titre.md téléchargé
- Ouvrir le fichier dans VSCode → Markdown valide
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F03 — DOSSIERS & ORGANISATION
## ═══════════════════════════════════════════

```
CONTEXTE : Éditeur de notes fonctionnel. Je dois ajouter les dossiers.

TÂCHE : Crée le système de dossiers/sous-dossiers pour les notes.

1. Crée src/components/brain/notes/FolderTree.vue :

INTERFACE :
- Arbre collapsible (comme VS Code Explorer)
- Dossier racine "📚 Toutes les notes" toujours visible
- Chaque dossier : icône colorée | nom | compteur de notes | menu ⋯
- Sous-dossiers indentés (padding-left croissant)
- Drag & drop pour déplacer notes et dossiers
- Bouton "+" à côté de chaque dossier pour créer un sous-dossier

STRUCTURE VISUELLE :
📚 Toutes les notes (42)
├── 📁 Développement (12)
│   ├── 📁 Vue.js (5)
│   ├── 📁 Supabase (4)
│   └── 📁 API (3)
├── 📁 Business (8)
│   ├── 📁 UrsUle (6)
│   └── 📁 Marketing (2)
├── 📁 Apprentissage (15)
└── 📁 Journal (7)

2. Actions sur dossier (menu contextuel ⋯ ou clic droit) :
- Renommer (édition inline)
- Changer icône (picker emoji)
- Changer couleur
- Créer sous-dossier
- Déplacer dans un autre dossier
- Supprimer (avec confirmation — déplace les notes dans "Sans dossier")

3. Créer src/services/folders.service.ts :
- getAll() → requête récursive avec parent_id
- create(name, parentId?, color?, icon?)
- update(id, data)
- delete(id) → met folder_id = NULL sur les notes du dossier
- buildTree(folders[]) → construit l'arbre hiérarchique

4. Dans NoteList.vue : filtrer les notes par dossier sélectionné dans FolderTree

5. Bouton "Nouvelle note" dans un dossier → crée la note dans ce dossier

6. VUES DE LA LISTE DES NOTES :
- Liste simple (titre + date + extrait)
- Grille de cards (3 colonnes)
- Compact (titre + tags, densité élevée)
- Tri : Par date | Alphabétique | Dernière modif | Temps de lecture

✅ VALIDATION :
- Créer un dossier "Vue.js" → visible dans l'arbre
- Créer un sous-dossier "Composants" dans "Vue.js" → indentation correcte
- Créer une note dans "Vue.js" → compteur passe à 1
- Glisser la note dans "Composants" → déplacée
- Supprimer "Vue.js" → les notes vont dans "Toutes les notes"
- Recherche globale → cherche dans tous les dossiers
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F04 — GRAPHE DE CONNAISSANCES
## ═══════════════════════════════════════════

```
CONTEXTE : Notes avec liens [[bidirectionnels]] fonctionnels.
Je dois visualiser le graphe de toutes les notes reliées.

TÂCHE : Crée la visualisation du graphe de connaissances.

DÉPENDANCES :
npm install d3 @types/d3

1. Crée src/components/brain/graph/KnowledgeGraph.vue :

DONNÉES DU GRAPHE :
- Nœuds = notes (id, title, tags, folder, degree = nombre de liens)
- Arêtes = note_links (source_note_id, target_note_id)
- Requête : récupérer toutes les notes + tous les liens de l'utilisateur

RENDU D3.js Force-Directed Graph :
- Simulation de forces (force simulation) :
  • forceLink → les liens attirent les nœuds connectés
  • forceManyBody → les nœuds se repoussent
  • forceCenter → centré au milieu du canvas
  • forceCollide → évite la superposition

STYLE DES NŒUDS :
- Taille proportionnelle au degree (nombre de connexions)
  • 1 lien → radius 5px
  • 5 liens → radius 10px
  • 10+ liens → radius 18px
- Couleur = couleur du dossier ou tag principal
- Label : titre de la note (affiché si zoom > 1.2x ou hover)
- Nœud sans liens : gris neutre
- Nœud actif (note ouverte) : cercle bleu avec halo

STYLE DES ARÊTES :
- Ligne fine, opacité 0.4
- Au hover sur un nœud : ses liens deviennent opaques + voisins mis en évidence
- Arête bidirectionnelle : légèrement plus épaisse

INTERACTIONS :
- Scroll / Pinch → zoom (d3.zoom)
- Drag nœud → repositionner
- Clic nœud → ouvrir la note dans l'éditeur (slide-over ou navigation)
- Hover nœud → tooltip : titre + nb liens + tags + dossier
- Double-clic fond → recentrer le graphe

CONTRÔLES (panneau flottant en bas à gauche) :
- Filtre par dossier (checkbox multi-select)
- Filtre par tag
- Slider opacité des labels
- Bouton "Recentrer"
- Bouton "Tout afficher" | "Nœuds connectés seulement"
- Bouton exporter en PNG (html2canvas sur le SVG)

VUE EN CERCLE (diagramme demandé) :
- Toggle : "Force" | "Cercle"
- En mode Cercle : les nœuds sont disposés sur des cercles concentriques
  • Cercle extérieur : nœuds avec peu de liens
  • Cercle intérieur : hubs (beaucoup de liens)
  • Les arêtes traversent le centre

2. Crée src/services/links.service.ts :
async function getGraphData(userId: string) {
  const [notes, links] = await Promise.all([
    supabase.from('notes').select('id, title, tags, folder_id, color').eq('user_id', userId).is('deleted_at', null),
    supabase.from('note_links').select('source_note_id, target_note_id').in('source_note_id', noteIds)
  ])
  return {
    nodes: notes.data.map(n => ({ ...n, degree: 0 })),
    edges: links.data
  }
}

3. Ajouter au router : /brain/graph → GraphView.vue

✅ VALIDATION :
- Créer 5 notes avec des liens entre elles via [[lien]]
- Ouvrir Graph → nœuds et arêtes visibles
- Hover sur un nœud → ses connexions s'illuminent
- Clic sur un nœud → la note s'ouvre
- Toggle Vue Cercle → les nœuds se repositionnent en cercle
- Zoom in/out fonctionne
- Export PNG téléchargé
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F05 — FLASHCARDS & SM-2
## ═══════════════════════════════════════════

```
CONTEXTE : Notes et liens fonctionnels. Je dois ajouter les flashcards
avec l'algorithme de répétition espacée SM-2.

TÂCHE : Crée le système de flashcards avec révision intelligente.

DÉPENDANCES :
npm install date-fns  (déjà installé)

1. Crée src/services/sm2.service.ts :
// Algorithme SM-2 (SuperMemo 2) — Répétition espacée
// Rating : 0=Bloqué, 1=Très difficile, 2=Difficile, 3=Correct, 4=Facile, 5=Très facile

export interface SM2State {
  repetitions: number
  easeFactor: number   // 2.5 par défaut, min 1.3
  intervalDays: number
  dueDate: Date
}

export function calculateNextReview(state: SM2State, rating: number): SM2State {
  let { repetitions, easeFactor, intervalDays } = state

  if (rating < 3) {
    // Mauvaise réponse → recommencer depuis 0
    repetitions = 0
    intervalDays = 1
  } else {
    // Bonne réponse → augmenter l'intervalle
    if (repetitions === 0) intervalDays = 1
    else if (repetitions === 1) intervalDays = 6
    else intervalDays = Math.round(intervalDays * easeFactor)

    repetitions++
    // Ajuster le facteur de facilité
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + intervalDays)

  return { repetitions, easeFactor, intervalDays, dueDate }
}

2. CRÉATION DE FLASHCARDS :
A. Depuis une note : bouton "Créer une flashcard" → dialogue pré-rempli
B. Syntaxe spéciale dans Markdown :
   Question :: Réponse          → crée une flashcard QA
   [Texte à compléter] :: Info  → crée une flashcard Cloze
C. Sélectionner du texte → menu contextuel "→ Flashcard"

3. Crée src/components/brain/flashcards/FlashcardReview.vue :

SESSION DE RÉVISION :
- Récupérer les cartes dont due_date <= aujourd'hui
- Afficher : "X cartes à réviser aujourd'hui" avec badge rouge si > 10

INTERFACE CARTE :
Phase 1 — QUESTION :
┌─────────────────────────────────────────────────────────┐
│  🃏  Carte 1/12           ████████░░░░░░  Deck: Vue.js  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│         Quel hook Vue 3 permet de créer                 │
│         une valeur réactive ?                           │
│                                                         │
└──────────────────────────────────────────────────────────┘
         [🙈 Voir la réponse]          [Passer]

Phase 2 — RÉPONSE RÉVÉLÉE :
┌─────────────────────────────────────────────────────────┐
│                 Réponse : ref() ou reactive()           │
├─────────────────────────────────────────────────────────┤
│  Comment tu t'en es sorti ?                             │
│  [😰 Bloqué 0] [😟 Difficile 2] [😐 Correct 3] [😊 Facile 4] [🚀 Très facile 5]
└─────────────────────────────────────────────────────────┘

Après chaque rating :
→ calculateNextReview() → sauvegarder dans flashcards + flashcard_reviews
→ Passer à la carte suivante

FIN DE SESSION :
- Score : X/Y bonnes réponses
- Graphe en barre : distribution des ratings
- "Prochain rappel : dans 3 jours" (prochaine due_date)
- Bouton "Recommencer les ratées"

4. Crée src/components/brain/flashcards/FlashcardDeck.vue :
- Liste des decks par note ou tag
- Compteur par deck : "12 cartes — 5 à réviser aujourd'hui"
- Bouton "Réviser maintenant"
- Bouton "Créer une carte"
- Stats du deck : taux de maîtrise (% avec rating >= 3)

5. Notifications de révision (via useNotifications) :
- Rappel quotidien à 8h00 (Africa/Abidjan) si des cartes sont dues
- "📚 Tu as 8 flashcards à réviser aujourd'hui"

✅ VALIDATION :
- Créer une flashcard "Vue 3 :: ref() reactive()"
- Aller dans Flashcards → 1 carte à réviser
- Cliquer "Voir la réponse" → réponse révélée
- Cliquer "Correct (3)" → carte disparaît, due_date = dans 6 jours
- Recommencer → carte visible dans 6 jours seulement
- Stats deck : 100% maîtrise après une bonne réponse
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F06 — QUIZ ACTIFS (FIN TÂCHE/PROJET)
## ═══════════════════════════════════════════

```
CONTEXTE : Système de notes et flashcards fonctionnel.
Je dois créer les quiz actifs déclenchés à la fin des tâches/projets.

TÂCHE : Crée le système de quiz actifs avec chrono et statistiques.

1. Crée src/components/brain/quiz/QuizDialog.vue :

DÉCLENCHEMENT :
→ Quand une tâche passe en "done" (après la validation gamifiée)
→ Quand un projet passe en "completed"
→ Manuellement depuis une note

TYPES DE QUESTIONS :

A. VRAI / FAUX :
┌─────────────────────────────────────────────────────────┐
│  ❓ Quiz rapide — Tâche "Apprendre useRef en Vue 3"     │
│  ─────────────────────────────────────────────────────  │
│  "useRef() est utilisé pour accéder aux éléments DOM    │
│   dans Vue 3 — Vrai ou Faux ?"                          │
│                                                         │
│         [✅ VRAI]              [❌ FAUX]                │
└─────────────────────────────────────────────────────────┘

B. CALCUL :
┌─────────────────────────────────────────────────────────┐
│  "Si tu as 8 tâches et que tu en complètes 5,           │
│   quel est ton taux de complétion en % ?"               │
│                                                         │
│         [___________] %         [Valider]               │
└─────────────────────────────────────────────────────────┘

C. AVIS OUVERT avec CHRONO :
┌─────────────────────────────────────────────────────────┐
│  ⏱️ 02:30  ████████████░░░░░░░░  (3 min pour répondre) │
│  ─────────────────────────────────────────────────────  │
│  "En 1-2 phrases, qu'as-tu appris dans cette tâche ?"   │
│                                                         │
│  [                                              ]       │
│  [                                              ]       │
│                              [Soumettre ma réponse]     │
└─────────────────────────────────────────────────────────┘

D. CHOIX MULTIPLE :
┌─────────────────────────────────────────────────────────┐
│  "Quelle est la meilleure approche pour..."             │
│  ○ A. Option 1                                         │
│  ○ B. Option 2                                         │
│  ○ C. Option 3                                         │
│  ○ D. Option 4                                         │
└─────────────────────────────────────────────────────────┘

2. LOGIQUE DU CHRONO dans le quiz :
- Pour type 'timer' : un chrono décompte depuis time_limit_seconds
- Le chrono est visible avec une barre de progression
- Si le temps expire → la question est marquée "non répondue"
- Le temps pris est sauvegardé → visible dans les stats

3. Crée src/composables/useQuiz.ts :
- generateQuizFromNote(noteId) → génère des questions depuis le contenu de la note
- generateQuizFromTask(taskId) → questions sur l'objectif de la tâche
- submitAnswer(quizId, answer, timeTaken) → sauvegarde + calcule si correct
- getQuizStats(userId, period) → stats des quiz

4. DÉCLENCHEMENT AUTOMATIQUE :
Dans tasks.store.ts, après handleTaskComplete() :
- Si la tâche a une note liée (linked_note_id) → déclencher QuizDialog
- Si la tâche a validation_type = 'question' → intégrer dans le flux existant
- Le dialog s'ouvre avec une transition smooth

Dans projects.store.ts, après markProjectComplete() :
- Récupérer les notes liées au projet
- Générer 3-5 questions → QuizDialog multi-questions (stepper)

5. STATS QUIZ dans BrainStats.vue :
- Taux de bonnes réponses par type (Vrai/Faux | Calcul | Avis)
- Temps moyen de réponse (en hausse ou en baisse — flèche colorée)
- Graphe courbe "performance dans le temps" (Chart.js)
- Streak de quiz (jours consécutifs avec au moins 1 quiz)
- "Tu réponds 20% plus vite qu'il y a un mois 🚀"

✅ VALIDATION :
- Compléter une tâche qui a une note liée → QuizDialog apparaît
- Type Vrai/Faux → répondre → feedback immédiat (✅ ou ❌)
- Type Timer → le chrono décompte, animation visible
- Fermer le quiz → résultat sauvegardé dans note_quizzes
- Voir dans BrainStats → quiz apparaît dans les stats
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F07 — MIND MAPS
## ═══════════════════════════════════════════

```
CONTEXTE : Notes, graphe et quiz fonctionnels.
Je dois ajouter les mind maps pour organiser les idées visuellement.

TÂCHE : Crée l'éditeur de mind maps.

DÉPENDANCES :
npm install @vue-flow/core @vue-flow/background @vue-flow/controls

1. Crée src/components/brain/mindmap/MindMapCanvas.vue :

INTERFACE :
- Canvas pleine page avec fond en points (background pattern)
- Nœud central : idea principale (cliquable pour éditer)
- Branches qui rayonnent depuis le centre
- Chaque branche peut avoir des sous-branches (infinie)

NŒUDS :
- Formes : Rectangle arrondi (défaut), Ellipse, Losange, Nuage
- Couleurs : palette 8 couleurs (cohérente avec le design system)
- Icône Lucide optionnelle sur chaque nœud
- Texte formaté : gras, italique
- Redimensionnable (drag les coins)

CONNEXIONS :
- Ligne courbe entre parent et enfant
- Couleur de la ligne = couleur du nœud enfant
- Épaisseur proportionnelle au niveau de profondeur

INTERACTIONS :
- Double-clic nœud → éditer le texte inline
- Clic sur connexion → bouton "+" pour ajouter une branche
- Drag nœud → repositionner librement
- Touche Suppr sur nœud sélectionné → supprimer (avec confirmation)
- Ctrl+Z / Cmd+Z → Annuler
- Ctrl+Y → Rétablir
- Scroll → Zoom in/out

TOOLBAR (flottante en haut) :
[Ajouter branche] [Supprimer] [Couleur] [Forme] | [Zoom +] [Zoom -] [Centrer]
[Exporter PNG] [Exporter SVG] [Lier à une note] [Partager]

2. CRÉATION depuis une note :
- Bouton "Créer une mind map" dans le header de la note
- Génère automatiquement un nœud central = titre de la note
- Et des branches = titres H2 de la note (parsing du Markdown)

3. Sauvegarde dans mind_maps :
- nodes JSONB : [{id, label, x, y, color, shape, parentId}]
- edges JSONB : [{source, target, style}]
- Sauvegarde auto toutes les 5 secondes si modification

4. Crée src/views/brain/MindMapView.vue :
- Liste des mind maps existantes (grille de miniatures)
- Bouton "Nouvelle mind map"
- Clic sur une miniature → ouvre l'éditeur pleine page

✅ VALIDATION :
- Créer une mind map "UrsUle Features"
- Ajouter 3 branches : "MVP V1", "V2", "V3"
- Ajouter sous-branches à "MVP V1"
- Drag une branche → repositionnée librement
- Exporter en PNG → image téléchargée
- Lier à une note UrsUle → visible dans les backlinks de la note
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F08 — JOURNAL QUOTIDIEN
## ═══════════════════════════════════════════

```
CONTEXTE : Module Brain quasi complet. Ajouter le journal quotidien.

TÂCHE : Crée le journal quotidien intégré.

1. Crée src/views/brain/JournalView.vue :

INTERFACE :
- Colonne gauche : liste des dates (calendrier mini + liste)
  • Dates avec entrée : point vert sur le calendrier
  • Clic sur une date → charge l'entrée de ce jour

- Colonne droite : éditeur du jour
  • Titre automatique : "Lundi 15 janvier 2025" (en français, Africa/Abidjan)
  • Template journalier optionnel :
    ### 🌅 Ce que je vais accomplir aujourd'hui
    -
    ### ✅ Ce que j'ai fait
    -
    ### 💡 Ce que j'ai appris
    -
    ### 😊 Mon humeur du jour
    -
    ### 🎯 Objectif de demain
    -

2. AUTOMATISATION :
- Si l'utilisateur n'a pas de journal d'hier → notification douce :
  "Tu n'as pas écrit hier. Veux-tu créer une entrée ?"
- Bouton "Journal du jour" dans le dashboard principal UrsUle
- Si tâches complétées hier → les lister automatiquement dans le template

3. STATISTIQUES JOURNAL :
- Streak journaling : nombre de jours consécutifs
- Mots écrits cette semaine / ce mois
- Heatmap (comme GitHub) des jours avec entrée

4. RECHERCHE dans le journal :
- Recherche full-text dans toutes les entrées de journal
- Résultats avec extrait contextualisé et date

5. EXPORT :
- Exporter le journal d'une période en PDF (rapport)
- Exporter en ZIP de fichiers .md (un par jour)
- Format : YYYY-MM-DD-journal.md

✅ VALIDATION :
- Ouvrir Journal → entrée du jour avec le template
- Écrire quelques lignes → sauvegardé automatiquement
- Calendrier → aujourd'hui a un point vert
- Naviguer vers hier → entrée vide (ou remplie si déjà écrit)
- Export PDF d'une semaine → fichier téléchargé avec les entrées
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F09 — RECHERCHE GLOBALE
## ═══════════════════════════════════════════

```
CONTEXTE : Beaucoup de notes. La recherche doit être rapide et précise.

TÂCHE : Crée la recherche globale dans toutes les notes.

1. Recherche full-text PostgreSQL :
-- Supabase SQL : recherche dans titre + contenu
-- (Index GIN créé dans BRAIN-F01)

Dans notes.service.ts :
async function searchNotes(userId: string, query: string): Promise<Note[]> {
  const { data } = await supabase
    .from('notes')
    .select('id, title, content, tags, folder_id, updated_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .textSearch('title,content', query, {
      type: 'websearch',
      config: 'french'
    })
    .limit(20)
  return data ?? []
}

2. Crée src/components/brain/SearchModal.vue :
- Raccourci clavier : Cmd+K (Mac) / Ctrl+K (Windows/Linux)
- Modal centré avec input de recherche autofocus
- Résultats en temps réel (debounce 200ms)
- Chaque résultat : icône dossier | titre | extrait avec terme mis en évidence
- Flèche haut/bas pour naviguer, Entrée pour ouvrir
- Sections : Notes | Tags | Dossiers | Flashcards | Mind Maps

3. Filtres de recherche dans la barre principale Brain :
- Par dossier (select)
- Par tag (multi-select chips)
- Par date (depuis/jusqu'à)
- Par type : Notes | Journal | Flashcards

4. Recherche dans les flashcards :
- Cherche dans question et réponse
- Filtre par deck, par taux de maîtrise

5. Dans l'éditeur : Cmd+F → recherche dans la note courante (Tiptap built-in find)

✅ VALIDATION :
- Cmd+K → modal s'ouvre
- Taper "vue" → notes contenant "vue" apparaissent avec mise en évidence
- Naviguer avec les flèches → sélection change
- Entrée → la note s'ouvre
- Chercher un tag "#javascript" → notes avec ce tag apparaissent
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F10 — PARTAGE AVEC PERMISSIONS
## ═══════════════════════════════════════════

```
CONTEXTE : Notes complètes. Je dois ajouter le partage sécurisé.

TÂCHE : Crée le système de partage de notes avec permissions granulaires.

NIVEAUX DE PERMISSION :
- 👁️ Lecture seule : peut voir la note mais pas modifier
- 💬 Commentaire : peut lire + ajouter des commentaires
- ✏️ Écriture : peut lire + modifier le contenu
- 🔒 Restreint : accès seulement à certaines pages/sections

1. Crée src/components/brain/notes/ShareNoteDialog.vue :

INTERFACE :
Onglet 1 — Partager par lien :
┌─────────────────────────────────────────────────────────┐
│  🔗 Partage par lien                                    │
│  ─────────────────────────────────────────────────────  │
│  Accès :  [👁️ Lecture ▼]  Expire :  [7 jours ▼]        │
│                                                         │
│  https://ursule.app/share/a7b3c9... [📋 Copier]         │
│                                                         │
│  [Désactiver le lien]                    [Créer le lien]│
└─────────────────────────────────────────────────────────┘

Onglet 2 — Partager avec une personne :
┌─────────────────────────────────────────────────────────┐
│  Email : [partenaire@email.com        ]                 │
│  Permission : [✏️ Écriture ▼]                           │
│                              [Envoyer l'invitation]     │
│  ─────────────────────────────────────────────────────  │
│  Partagée avec :                                        │
│  👤 partner@email.com — ✏️ Écriture  [Révoquer]         │
└─────────────────────────────────────────────────────────┘

2. Page publique pour les notes partagées :
Route : /share/:token (page sans auth requise)
- Récupérer la note via le token (share_permission != 'none')
- Afficher en lecture seule avec le rendu Markdown
- Header : "Note partagée par Krsidoine • UrsUle Brain"
- Bouton "Créer mon propre compte UrsUle" (appel à l'action)
- Si permission 'comment' → afficher un champ commentaire en bas

3. Notes restreintes à certaines sections :
- Dans l'éditeur : sélectionner du texte → "🔒 Restreindre cette section"
- La section est masquée pour les lecteurs non autorisés
- Remplacée par "[Section restreinte — accès limité]"

4. Dans notes.service.ts :
async function createShareLink(noteId: string, permission: string, expiresInDays?: number) {
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null
  const { data } = await supabase
    .from('note_shares')
    .insert({ note_id: noteId, owner_id: userId, permission, expires_at: expiresAt })
    .select('share_token').single()
  return `${window.location.origin}/share/${data.share_token}`
}

5. Sécurité :
- Vérifier expiration du token côté serveur
- Rate limiting sur les pages publiques
- Ne jamais exposer le user_id dans l'URL publique

✅ VALIDATION :
- Ouvrir une note → "Partager" → créer un lien lecture
- Ouvrir le lien en navigation privée → note visible en lecture
- Modifier le token dans l'URL → 404
- Expirer le lien → 410 Gone
- Partager avec un email → la personne peut modifier la note
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F11 — STATISTIQUES PKM SÉPARÉES
## ═══════════════════════════════════════════

```
CONTEXTE : Toutes les features Brain présentes.
Je dois créer des statistiques dédiées au PKM, séparées des stats de tâches.

TÂCHE : Crée le dashboard de statistiques UrsUle Brain.

1. Crée src/components/brain/stats/BrainStats.vue :

MÉTRIQUES GLOBALES (4 cards en haut) :
- 📝 Notes totales | +X cette semaine
- 🃏 Flashcards maîtrisées | % du total
- 🔗 Liens créés | +X cette semaine
- 📅 Streak journaling | X jours consécutifs

GRAPHIQUES :

A. Notes créées par semaine (Line chart — 12 semaines)
   Couleur : forêt vert

B. Progression flashcards (Stacked bar chart)
   - Maîtrisées (vert) vs En cours (bleu) vs Difficiles (rouge)
   - Une barre par deck

C. Temps de réponse aux quiz (Line chart)
   - Axe X : temps
   - Axe Y : secondes pour répondre
   - Flèche tendance : "En hausse ↗" (rouge) | "En baisse ↘" (vert = amélioration)

D. Répartition des tags (Donut chart)
   - Quels tags apparaissent le plus dans tes notes

E. Heatmap journaling (comme GitHub contributions)
   - 180 derniers jours
   - Vert clair → 1 entrée, Vert foncé → longue entrée

F. Distribution quiz (Horizontal bar)
   - % bonnes réponses par type (Vrai/Faux | Calcul | Avis | Timer)

2. BADGES & ACHIEVEMENTS :
- 🌱 "Première note" → créé ta première note
- 🔗 "Penseur connecté" → 10 liens entre notes
- 🃏 "Mémorisateur" → 50 flashcards maîtrisées
- 📅 "Journaliste" → 7 jours de journal consécutifs
- 🕸️ "Architecte du savoir" → 100 notes avec graphe dense
- ⚡ "Quiz Master" → 90% de bonnes réponses sur 30 quiz

3. COMPARAISON TÂCHES vs BRAIN :
- "Cette semaine tu as créé 8 tâches et 5 notes"
- "Tes notes liées aux projets : 65% ont des flashcards"
- "Projets avec notes : +40% de taux de complétion"

4. Dans le Dashboard principal (DashboardView.vue), ajouter :
- Widget "Flashcards du jour" (nombre de cartes à réviser)
- Widget "Dernière note" (titre + extrait)
- Widget "Streak Brain" (jours de journaling)

✅ VALIDATION :
- BrainStats affiche les vrais chiffres (pas des zeros)
- Le graphe de flashcards montre la progression
- Les badges s'affichent dès que la condition est remplie
- Le temps de réponse quiz est bien mesuré et affiché
```

---

## ═══════════════════════════════════════════
## 🟦 BRAIN-F12 — INTÉGRATION URSULE TASKS
## ═══════════════════════════════════════════

```
CONTEXTE : UrsUle Brain complet. Je dois connecter les notes aux tâches/projets existants.

TÂCHE : Intègre UrsUle Brain avec le système de tâches et projets.

1. DANS LES TÂCHES (TaskDetail.vue) :
- Section "📝 Notes liées" : afficher les notes liées à cette tâche
- Bouton "Lier une note" → search/select une note existante
- Bouton "Créer une note pour cette tâche" → ouvre l'éditeur avec :
  • Titre pré-rempli : "[Tâche] Mon titre de tâche"
  • Template : description de la tâche + sections Apprentissages / Questions

2. DANS LES PROJETS (ProjectDetailView.vue) :
- Nouvel onglet "Notes" dans le projet
- Liste les notes liées au projet
- Wiki du projet : une note spéciale "README du projet"
- À la complétion d'un projet → QuizDialog avec questions sur les notes du projet

3. DANS LES NOTES (NoteEditor.vue) :
- Panneau droit : "Lié à"
  • Tâche liée (avec statut)
  • Projet lié (avec progression)
  • Clic → ouvre la tâche/projet en slide-over

4. DANS LE DASHBOARD :
- "🧠 Brain du jour" : X flashcards à réviser | Entrée journal ?
- Lien direct vers la note du projet en cours

5. FIN DE TÂCHE → QUIZ (flux complet) :
Compléter tâche → ValidationModal (calcul) → AppreciationModal (emoji)
→ [Si note liée] QuizDialog (questions sur la note)
→ Toast "🎉 Tâche et apprentissage enregistrés !"

6. DANS L'API (api-ursule V2) :
Ajouter les endpoints notes :
GET    /v1/notes              → lister les notes
POST   /v1/notes              → créer une note
GET    /v1/notes/:id          → détail note + backlinks
PUT    /v1/notes/:id          → modifier une note
DELETE /v1/notes/:id          → supprimer
GET    /v1/notes/:id/backlinks → notes qui lient vers cette note
GET    /v1/graph              → données pour le graphe (nœuds + arêtes)
GET    /v1/flashcards/due     → flashcards à réviser aujourd'hui
POST   /v1/flashcards/:id/review → soumettre un rating SM-2

Dans le SDK (@ursule/sdk) :
ursule.notes.list()
ursule.notes.create({ title, content, folderId })
ursule.notes.linkToTask(noteId, taskId)
ursule.flashcards.getDue()
ursule.flashcards.review(cardId, rating)

✅ VALIDATION FINALE :
- Créer une tâche "Apprendre Supabase RLS"
- Créer une note "Supabase RLS expliqué"
- Lier la note à la tâche
- Créer 3 flashcards depuis la note
- Compléter la tâche → validation → quiz sur la note
- Dashboard → "3 flashcards à réviser"
- API : GET /v1/notes retourne les notes
- SDK : ursule.notes.list() fonctionne
```

---

## 📋 CHECKLIST BRAIN COMPLÈTE

| Feature | Priorité | Durée | Validé |
|---|---|---|---|
| BRAIN-F01 | Setup DB + Navigation | P0 | 2j | ⬜ |
| BRAIN-F02 | Éditeur Markdown avancé + [[liens]] | P0 | 4j | ⬜ |
| BRAIN-F03 | Dossiers & Organisation | P1 | 2j | ⬜ |
| BRAIN-F04 | Graphe de connaissances (D3.js) | P1 | 3j | ⬜ |
| BRAIN-F05 | Flashcards & SM-2 | P1 | 4j | ⬜ |
| BRAIN-F06 | Quiz actifs fin tâche/projet | P1 | 3j | ⬜ |
| BRAIN-F07 | Mind Maps | P2 | 3j | ⬜ |
| BRAIN-F08 | Journal quotidien | P2 | 2j | ⬜ |
| BRAIN-F09 | Recherche globale | P1 | 2j | ⬜ |
| BRAIN-F10 | Partage avec permissions | P2 | 3j | ⬜ |
| BRAIN-F11 | Statistiques PKM séparées | P2 | 3j | ⬜ |
| BRAIN-F12 | Intégration UrsUle Tasks + API | P1 | 3j | ⬜ |
| **TOTAL** | | | **~34 jours** | |

---

## 📅 OÙ URSULE BRAIN S'INTÈGRE DANS LA ROADMAP

```
MVP V1          V2-Phase1    V2-Phase2    V2-Phase3        V3
(Tâches)        (API+MCP)    (BRAIN)      (Collab)         (IA+Mobile)
────────         ─────────    ─────────    ─────────        ─────────
✅ CRUD          ✅ api-urs.  ✅ F01-F06   ✅ Realtime      ✅ IA Brain
✅ Stats         ✅ mcp-urs.  ✅ F07-F09   ✅ Multi-user    ✅ Mobile
✅ Projets       ✅ SDK       ✅ F10-F12   ✅ Google Drive  ✅ Abonnement
```

**Ordre recommandé après MVP V1 :**
1. API_URSULE (api-ursule) → 3 semaines
2. MCP_URSULE (mcp-ursule) → 2 semaines
3. **BRAIN-F01 à F06** (notes + graphe + flashcards + quiz) → 3 semaines
4. BRAIN-F07 à F12 (mind maps + journal + stats + intégration) → 3 semaines
5. V2 Collaboration (Realtime + multi-user) → 4 semaines

---

## 📚 DÉPENDANCES NPM À INSTALLER

```bash
# Graphe D3.js
npm install d3 @types/d3

# Mind Maps
npm install @vue-flow/core @vue-flow/background @vue-flow/controls

# Recherche fuzzy (suggestions liens)
npm install fuse.js

# Coloration syntaxique dans le code
npm install lowlight @tiptap/extension-code-block-lowlight

# Extensions Tiptap supplémentaires
npm install @tiptap/extension-mention @tiptap/extension-table
npm install @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

---
*UrsUle Brain — Le moteur d'apprentissage et de connaissance intégré à UrsUle*
