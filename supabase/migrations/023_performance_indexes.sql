-- ==============================================================================
-- MIGRATION 023 : INDEX DE PERFORMANCE & SCALABILITÉ
-- Objectif : Optimiser les requêtes à fort volume (10 000+ tâches et notes)
-- pour maintenir un temps de réponse instantané au fur et à mesure que les données grossissent.
-- Conformité : ChefsUrsUle (Présentation explicite et vérification manuelle)
-- ==============================================================================

-- 1. Index composite pour le filtrage et le tri des tâches par statut et ordre
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_sort 
ON tasks (user_id, status, sort_order) 
WHERE deleted_at IS NULL;

-- 2. Index pour accélérer le calcul des tâches en retard et du jour (overdue / today)
CREATE INDEX IF NOT EXISTS idx_tasks_user_deadline 
ON tasks (user_id, deadline) 
WHERE deleted_at IS NULL AND status != 'done';

-- 3. Index composite pour trier les notes par date de modification (Brain & Chronologie)
CREATE INDEX IF NOT EXISTS idx_notes_user_updated_at 
ON notes (user_id, updated_at DESC) 
WHERE deleted_at IS NULL;

-- 4. Index composite pour isoler rapidement les journaux quotidiens et leurs dates
CREATE INDEX IF NOT EXISTS idx_notes_journal_date 
ON notes (user_id, is_journal, journal_date DESC) 
WHERE deleted_at IS NULL AND is_journal = TRUE;

-- 5. Index pour accélérer le tri et l'arborescence des dossiers de notes
CREATE INDEX IF NOT EXISTS idx_note_folders_user_parent_sort 
ON note_folders (user_id, parent_id, sort_order) 
WHERE deleted_at IS NULL;

-- 6. Index pour la recherche rapide des sous-tâches actives par tâche parente
CREATE INDEX IF NOT EXISTS idx_tasks_parent_sort 
ON tasks (parent_task_id, sort_order) 
WHERE deleted_at IS NULL AND parent_task_id IS NOT NULL;
