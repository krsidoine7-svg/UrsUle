-- ═══════════════════════════════════════════════════════════════════
-- Migration 018 : Audit de Sécurité et Durcissement RLS (RGPD & OWASP)
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Forcer l'activation de la RLS sur TOUTES les tables ────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- ─── 2. S'assurer que les tables secondaires sont bien sécurisées ──
-- Les tables principales (tasks, projects) ont déjà leurs policies.
-- On s'assure que les tables secondaires ont des policies restrictives.

DROP POLICY IF EXISTS "task_comments_own" ON task_comments;
CREATE POLICY "task_comments_own" ON task_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

DROP POLICY IF EXISTS "task_images_own" ON task_images;
CREATE POLICY "task_images_own" ON task_images FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_images.task_id AND tasks.user_id = auth.uid())
);

DROP POLICY IF EXISTS "time_sessions_own" ON time_sessions;
CREATE POLICY "time_sessions_own" ON time_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = time_sessions.task_id AND tasks.user_id = auth.uid())
);

DROP POLICY IF EXISTS "webhook_logs_own" ON webhook_logs;
CREATE POLICY "webhook_logs_own" ON webhook_logs FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- ─── 3. Suppression des permissions public (durcissement) ──────────
-- On révoque explicitement l'accès par défaut (si jamais il avait été accordé par erreur)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
