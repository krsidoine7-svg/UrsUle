-- ═══════════════════════════════════════════════════════════════════
-- Migration 022 : Correctifs de Sécurité (Search Path, Exécution et RLS)
-- ═══════════════════════════════════════════════════════════════════
-- Cette migration :
-- 1. Fixe le search_path sur les fonctions purge_trash_tasks et handle_new_user
-- 2. Limite l'exécution des fonctions SECURITY DEFINER aux rôles internes (revoking PUBLIC)
-- 3. Débloque le trigger d'authentification en accordant explicitement EXECUTE à supabase_auth_admin
-- 4. Durcit toutes les politiques RLS existantes en forçant le ciblage TO authenticated
-- ═══════════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 1 : SEARCH PATHS DES FONCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- purge_trash_tasks (si elle existe sur le serveur)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'purge_trash_tasks') THEN
    EXECUTE 'ALTER FUNCTION public.purge_trash_tasks() SET search_path = public';
  END IF;
END $$;

-- handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 2 : REVISE EXECUTE PRIVILEGES ON SECURITY DEFINER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Révocation générale de PUBLIC sur toutes les fonctions SECURITY DEFINER critiques
-- pour empêcher l'exécution non authentifiée via RPC (/rest/v1/rpc/...)

-- purge_trash_tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'purge_trash_tasks') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.purge_trash_tasks() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.purge_trash_tasks() TO service_role, postgres';
  END IF;
END $$;

-- check_upcoming_deadlines
REVOKE EXECUTE ON FUNCTION public.check_upcoming_deadlines() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_upcoming_deadlines() TO service_role, postgres;

-- generate_daily_digest
REVOKE EXECUTE ON FUNCTION public.generate_daily_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_daily_digest() TO service_role, postgres;

-- handle_folder_soft_delete
REVOKE EXECUTE ON FUNCTION public.handle_folder_soft_delete() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_folder_soft_delete() TO service_role, postgres;

-- handle_note_soft_delete_secondary
REVOKE EXECUTE ON FUNCTION public.handle_note_soft_delete_secondary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_note_soft_delete_secondary() TO service_role, postgres;

-- handle_project_soft_delete
REVOKE EXECUTE ON FUNCTION public.handle_project_soft_delete() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_project_soft_delete() TO service_role, postgres;

-- handle_recurring_task
REVOKE EXECUTE ON FUNCTION public.handle_recurring_task() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_recurring_task() TO service_role, postgres;

-- handle_task_soft_delete_secondary
REVOKE EXECUTE ON FUNCTION public.handle_task_soft_delete_secondary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_task_soft_delete_secondary() TO service_role, postgres;

-- handle_new_user (Débloque le trigger d'auth de GoTrue en donnant les privilèges à supabase_auth_admin)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, postgres, supabase_auth_admin;

-- set_admin_on_signup (De même pour le trigger des profils admins - empaqueté de manière sécurisée si non existant)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_admin_on_signup') THEN
    EXECUTE 'ALTER FUNCTION public.set_admin_on_signup() SET search_path = public';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_admin_on_signup() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.set_admin_on_signup() TO service_role, postgres, supabase_auth_admin';
  END IF;
END $$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECTION 3 : DURCISSEMENT DES POLITIQUES RLS (TO authenticated)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- profiles
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- categories
DROP POLICY IF EXISTS "categories_own" ON public.categories;
CREATE POLICY "categories_own" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id);

-- projects
DROP POLICY IF EXISTS "projects_own" ON public.projects;
CREATE POLICY "projects_own" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "tasks_own_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_own_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_own_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_own_delete" ON public.tasks;
CREATE POLICY "tasks_own_select" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_own_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_own_update" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_own_delete" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- task_comments
DROP POLICY IF EXISTS "comments_via_task" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_own" ON public.task_comments;
CREATE POLICY "task_comments_own" ON public.task_comments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

-- task_images
DROP POLICY IF EXISTS "images_via_task" ON public.task_images;
DROP POLICY IF EXISTS "task_images_own" ON public.task_images;
CREATE POLICY "task_images_own" ON public.task_images FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_images.task_id AND tasks.user_id = auth.uid())
);

-- time_sessions
DROP POLICY IF EXISTS "sessions_own" ON public.time_sessions;
DROP POLICY IF EXISTS "time_sessions_own" ON public.time_sessions;
CREATE POLICY "time_sessions_own" ON public.time_sessions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = time_sessions.task_id AND tasks.user_id = auth.uid())
);

-- webhook_logs
DROP POLICY IF EXISTS "webhooks_own" ON public.webhook_logs;
DROP POLICY IF EXISTS "webhook_logs_own" ON public.webhook_logs;
DROP POLICY IF EXISTS "Users can view their own webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Users can insert their own webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Users can delete their own webhook logs" ON public.webhook_logs;
CREATE POLICY "webhook_logs_own" ON public.webhook_logs FOR ALL TO authenticated USING (user_id = auth.uid());

-- notifications
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- notes
DROP POLICY IF EXISTS "notes_own" ON public.notes;
CREATE POLICY "notes_own" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- note_folders
DROP POLICY IF EXISTS "folders_own" ON public.note_folders;
CREATE POLICY "folders_own" ON public.note_folders FOR ALL TO authenticated USING (auth.uid() = user_id);

-- note_links
DROP POLICY IF EXISTS "links_own" ON public.note_links;
CREATE POLICY "links_own" ON public.note_links FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_links.source_note_id AND notes.user_id = auth.uid())
);

-- flashcards
DROP POLICY IF EXISTS "flashcards_own" ON public.flashcards;
CREATE POLICY "flashcards_own" ON public.flashcards FOR ALL TO authenticated USING (auth.uid() = user_id);

-- flashcard_reviews
DROP POLICY IF EXISTS "reviews_own" ON public.flashcard_reviews;
CREATE POLICY "reviews_own" ON public.flashcard_reviews FOR ALL TO authenticated USING (auth.uid() = user_id);

-- mind_maps
DROP POLICY IF EXISTS "mindmaps_own" ON public.mind_maps;
CREATE POLICY "mindmaps_own" ON public.mind_maps FOR ALL TO authenticated USING (auth.uid() = user_id);

-- note_quizzes
DROP POLICY IF EXISTS "quizzes_own" ON public.note_quizzes;
CREATE POLICY "quizzes_own" ON public.note_quizzes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- note_shares
DROP POLICY IF EXISTS "shares_own" ON public.note_shares;
CREATE POLICY "shares_own" ON public.note_shares FOR ALL TO authenticated USING (auth.uid() = owner_id);
