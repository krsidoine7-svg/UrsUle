-- 1. Ajout de la colonne deleted_at à projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Création d'index partiels pour la haute performance sous charge
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

-- Index partiels d'utilisateurs actifs (ignorent les lignes soft-deleted)
CREATE INDEX IF NOT EXISTS idx_projects_active_user 
ON projects (user_id) 
WHERE deleted_at IS NULL;

-- Index partiels sur les tâches actives d'un utilisateur et projets
CREATE INDEX IF NOT EXISTS idx_tasks_active_user 
ON tasks (user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_active_project 
ON tasks (project_id) 
WHERE deleted_at IS NULL;

-- 3. Trigger pour suppression logique en cascade et restauration automatique
DROP TRIGGER IF EXISTS on_project_soft_delete ON projects;
DROP FUNCTION IF EXISTS handle_project_soft_delete;

CREATE OR REPLACE FUNCTION handle_project_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft-delete de toutes les tâches associées qui ne le sont pas déjà
    UPDATE tasks 
    SET deleted_at = NEW.deleted_at 
    WHERE project_id = NEW.id AND deleted_at IS NULL;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restauration des tâches qui ont été supprimées en même temps que le projet
    UPDATE tasks
    SET deleted_at = NULL
    WHERE project_id = NEW.id AND deleted_at = OLD.deleted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_soft_delete
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_project_soft_delete();
