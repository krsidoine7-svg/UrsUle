-- Ajout de sort_order aux tâches pour le drag & drop des sous-tâches
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
