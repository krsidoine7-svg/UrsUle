-- ═══════════════════════════════════════════════════════════════════
-- Migration 013 : Soft Delete pour note_folders et flashcards
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Colonne deleted_at sur note_folders ───────────────────────
ALTER TABLE note_folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index partiel pour les dossiers actifs
CREATE INDEX IF NOT EXISTS idx_note_folders_deleted_at ON note_folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_note_folders_active_user
  ON note_folders(user_id)
  WHERE deleted_at IS NULL;

-- ─── 2. Trigger de cascade : soft-delete des sous-dossiers ────────
-- Quand un dossier parent est soft-supprimé, ses enfants le sont aussi.
-- Quand il est restauré, ses enfants sont restaurés en même temps.
DROP TRIGGER IF EXISTS on_folder_soft_delete ON note_folders;
DROP FUNCTION IF EXISTS handle_folder_soft_delete();

CREATE OR REPLACE FUNCTION handle_folder_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Cascade soft-delete sur les sous-dossiers directs (récursif via trigger)
    UPDATE note_folders
    SET deleted_at = NEW.deleted_at
    WHERE parent_id = NEW.id AND deleted_at IS NULL;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restaurer les sous-dossiers qui ont été supprimés au même moment
    UPDATE note_folders
    SET deleted_at = NULL
    WHERE parent_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_folder_soft_delete
  AFTER UPDATE ON note_folders
  FOR EACH ROW
  EXECUTE FUNCTION handle_folder_soft_delete();

-- ─── 3. Colonne deleted_at sur flashcards ─────────────────────────
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_flashcards_deleted_at ON flashcards(deleted_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_active_user
  ON flashcards(user_id)
  WHERE deleted_at IS NULL;

-- ─── 4. Mise à jour du filtre RLS existant (si nécessaire) ────────
-- Les policies RLS existantes filtrent déjà par user_id.
-- Aucune modification de policy requise car le frontend gère le filtre deleted_at.

-- ─── 5. Activer le Realtime sur note_folders (si pas déjà fait) ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'note_folders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE note_folders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'flashcards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE flashcards;
  END IF;
END $$;
