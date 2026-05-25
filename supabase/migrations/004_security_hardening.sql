-- ════════════════════════════════════════════════════════════════════════════════
-- 🛡️ MIGRATION 004 : SÉCURISATION ET DURCISSEMENT (HARDENING)
-- ════════════════════════════════════════════════════════════════════════════════
-- Cette migration répond aux alertes de sécurité du linter Supabase :
-- 1. Fixe le search_path des fonctions SECURITY DEFINER
-- 2. Restreint l'exécution des fonctions système aux rôles internes
-- 3. Limite les politiques RLS aux utilisateurs authentifiés uniquement (TO authenticated)
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. DURCISSEMENT DES FONCTIONS
-- --------------------------------------------------------------------------------

-- handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, postgres;

-- create_default_categories
ALTER FUNCTION public.create_default_categories(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.create_default_categories(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_default_categories(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_categories(uuid) TO service_role, postgres;

-- rls_auto_enable (si existante)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role, postgres;
    END IF;
END $$;


-- 2. DURCISSEMENT DES POLITIQUES RLS (TO authenticated)
-- --------------------------------------------------------------------------------

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "categories_own" ON categories;
CREATE POLICY "categories_own" ON categories FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Projects
DROP POLICY IF EXISTS "projects_own" ON projects;
CREATE POLICY "projects_own" ON projects FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Tasks
DROP POLICY IF EXISTS "tasks_own_select" ON tasks;
CREATE POLICY "tasks_own_select" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_own_insert" ON tasks;
CREATE POLICY "tasks_own_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_own_update" ON tasks;
CREATE POLICY "tasks_own_update" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_own_delete" ON tasks;
CREATE POLICY "tasks_own_delete" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Task comments
DROP POLICY IF EXISTS "comments_via_task" ON task_comments;
CREATE POLICY "comments_via_task" ON task_comments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

-- Task images
DROP POLICY IF EXISTS "images_via_task" ON task_images;
CREATE POLICY "images_via_task" ON task_images FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_images.task_id AND tasks.user_id = auth.uid())
);

-- Time sessions
DROP POLICY IF EXISTS "sessions_own" ON time_sessions;
CREATE POLICY "sessions_own" ON time_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Webhook logs
DROP POLICY IF EXISTS "webhooks_own" ON webhook_logs;
CREATE POLICY "webhooks_own" ON webhook_logs FOR ALL TO authenticated USING (auth.uid() = user_id);
