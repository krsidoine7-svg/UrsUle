-- ═══════════════════════════════════════════════════════════════════
-- Migration 014 : Soft Delete global — toutes les tables secondaires
-- ═══════════════════════════════════════════════════════════════════
-- Stratégie retenue :
--   • Niveau A (Récupérable via Corbeille UX) :
--       mind_maps, note_quizzes, task_comments, task_images, time_sessions
--   • Niveau B (Archive technique, pas de Corbeille UX) :
--       flashcard_reviews, note_links, note_shares, webhook_logs, notifications
--   • Niveau C (Profils — désactivation logique uniquement, jamais d'UI Corbeille) :
--       profiles
-- NOTE : Les tables tasks, projects, notes, note_folders, flashcards
--        ont déjà leur deleted_at (migrations 001, 011, 012, 013).
-- ═══════════════════════════════════════════════════════════════════


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NIVEAU A — Récupérables via Corbeille UX
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─── mind_maps ────────────────────────────────────────────────────
-- Cartes mentales créées par l'utilisateur : suppression logique
-- avec Corbeille UI envisageable (comme les notes).
ALTER TABLE mind_maps ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_mind_maps_deleted_at ON mind_maps(deleted_at);
CREATE INDEX IF NOT EXISTS idx_mind_maps_active_user
  ON mind_maps(user_id) WHERE deleted_at IS NULL;

-- ─── note_quizzes ─────────────────────────────────────────────────
-- Quiz liés aux tâches/projets/notes : garder l'historique récupérable.
ALTER TABLE note_quizzes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_note_quizzes_deleted_at ON note_quizzes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_note_quizzes_active_user
  ON note_quizzes(user_id) WHERE deleted_at IS NULL;

-- ─── task_comments ────────────────────────────────────────────────
-- Commentaires sur les tâches : soft-delete pour permettre la restauration
-- et éviter la perte d'historique de discussion.
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_task_comments_deleted_at ON task_comments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_active_task
  ON task_comments(task_id) WHERE deleted_at IS NULL;

-- ─── task_images ──────────────────────────────────────────────────
-- Images attachées aux tâches : soft-delete avant suppression du fichier
-- Storage (évite orphelins si l'opération Storage échoue).
ALTER TABLE task_images ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_task_images_deleted_at ON task_images(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_images_active_task
  ON task_images(task_id) WHERE deleted_at IS NULL;

-- ─── time_sessions ────────────────────────────────────────────────
-- Séances de temps Pomodoro/chrono : suppression logique pour conserver
-- les statistiques historiques (temps total travaillé, etc.).
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_time_sessions_deleted_at ON time_sessions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_time_sessions_active_task
  ON time_sessions(task_id) WHERE deleted_at IS NULL;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NIVEAU B — Archive technique (pas de Corbeille UX)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─── flashcard_reviews ────────────────────────────────────────────
-- Historique des révisions SM-2 : on garde une trace même supprimée
-- pour ne pas fausser les statistiques d'apprentissage.
ALTER TABLE flashcard_reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_deleted_at ON flashcard_reviews(deleted_at);

-- ─── note_links ───────────────────────────────────────────────────
-- Liens bidirectionnels entre notes : soft-delete pour préserver
-- l'historique des connexions (graphe de connaissances).
-- Un lien supprimé ne s'affiche plus dans le graphe mais reste en base.
ALTER TABLE note_links ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_note_links_deleted_at ON note_links(deleted_at);
CREATE INDEX IF NOT EXISTS idx_note_links_active_source
  ON note_links(source_note_id) WHERE deleted_at IS NULL;

-- ─── note_shares ──────────────────────────────────────────────────
-- Partages de notes : soft-delete plutôt que suppression physique
-- pour auditer les accès révoqués.
ALTER TABLE note_shares ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_note_shares_deleted_at ON note_shares(deleted_at);

-- ─── webhook_logs ─────────────────────────────────────────────────
-- Logs d'exécution des webhooks : archivage logique pour audit.
-- La suppression physique est irréversible et perd la traçabilité.
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_deleted_at ON webhook_logs(deleted_at);

-- ─── notifications ────────────────────────────────────────────────
-- Notifications système : soft-delete pour distinguer "lu et archivé"
-- de "supprimé définitivement" (au-delà du flag is_read).
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notifications_active_user
  ON notifications(user_id) WHERE deleted_at IS NULL;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NIVEAU C — Désactivation logique de compte (profiles)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ─── profiles ─────────────────────────────────────────────────────
-- Profils utilisateurs : deleted_at permet la désactivation logique
-- du compte SANS toucher à auth.users (suppression différée ou RGPD).
-- La suppression physique de auth.users cascade sur profiles.
-- IMPORTANT : Ne jamais afficher de Corbeille UI pour les profiles.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS DE CASCADE — Cohérence relationnelle
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Quand une tâche est soft-supprimée :
--   → soft-delete ses commentaires, images et sessions de temps associés
DROP TRIGGER IF EXISTS on_task_soft_delete_secondary ON tasks;
DROP FUNCTION IF EXISTS handle_task_soft_delete_secondary();

CREATE OR REPLACE FUNCTION handle_task_soft_delete_secondary()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Cascade soft-delete sur les éléments secondaires de la tâche
    UPDATE task_comments
      SET deleted_at = NEW.deleted_at
      WHERE task_id = NEW.id AND deleted_at IS NULL;

    UPDATE task_images
      SET deleted_at = NEW.deleted_at
      WHERE task_id = NEW.id AND deleted_at IS NULL;

    UPDATE time_sessions
      SET deleted_at = NEW.deleted_at
      WHERE task_id = NEW.id AND deleted_at IS NULL;

  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restauration des éléments supprimés au même moment
    UPDATE task_comments
      SET deleted_at = NULL
      WHERE task_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE task_images
      SET deleted_at = NULL
      WHERE task_id = NEW.id AND deleted_at = OLD.deleted_at;

    UPDATE time_sessions
      SET deleted_at = NULL
      WHERE task_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_soft_delete_secondary
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_soft_delete_secondary();


-- Quand une note est soft-supprimée :
--   → soft-delete ses note_links (graphe) et mind_maps associées
DROP TRIGGER IF EXISTS on_note_soft_delete_secondary ON notes;
DROP FUNCTION IF EXISTS handle_note_soft_delete_secondary();

CREATE OR REPLACE FUNCTION handle_note_soft_delete_secondary()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE note_links
      SET deleted_at = NEW.deleted_at
      WHERE (source_note_id = NEW.id OR target_note_id = NEW.id)
        AND deleted_at IS NULL;

    UPDATE mind_maps
      SET deleted_at = NEW.deleted_at
      WHERE note_id = NEW.id AND deleted_at IS NULL;

  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE note_links
      SET deleted_at = NULL
      WHERE (source_note_id = NEW.id OR target_note_id = NEW.id)
        AND deleted_at = OLD.deleted_at;

    UPDATE mind_maps
      SET deleted_at = NULL
      WHERE note_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_note_soft_delete_secondary
  AFTER UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION handle_note_soft_delete_secondary();


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- REALTIME — Activer sur les nouvelles tables si besoin
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'mind_maps', 'note_quizzes', 'task_comments', 'task_images',
    'time_sessions', 'flashcard_reviews', 'note_links', 'note_shares',
    'webhook_logs', 'notifications'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON pr.prrelid = c.oid
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
