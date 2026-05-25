-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Categories
CREATE POLICY "categories_own" ON categories FOR ALL USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "tasks_own_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_own_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_own_update" ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_own_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Task comments
CREATE POLICY "comments_via_task" ON task_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

-- Task images
CREATE POLICY "images_via_task" ON task_images FOR ALL USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_images.task_id AND tasks.user_id = auth.uid())
);

-- Time sessions
CREATE POLICY "sessions_own" ON time_sessions FOR ALL USING (auth.uid() = user_id);

-- Webhook logs
CREATE POLICY "webhooks_own" ON webhook_logs FOR ALL USING (auth.uid() = user_id);
