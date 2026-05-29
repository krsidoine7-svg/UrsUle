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
CREATE INDEX idx_notes_fts ON notes USING GIN(to_tsvector('french', title || ' ' || COALESCE(content, '')));

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
