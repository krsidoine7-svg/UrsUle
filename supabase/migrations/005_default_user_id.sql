-- ════════════════════════════════════════════════════════════════════════════════
-- 🛠️ MIGRATION 005 : AUTOMATISATION DU USER_ID
-- ════════════════════════════════════════════════════════════════════════════════
-- Cette migration permet de ne plus avoir à envoyer explicitement le user_id 
-- depuis le front-end, ce qui renforce la sécurité et simplifie le code.
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.projects ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.tasks ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.task_comments ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.task_images ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.time_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.webhook_logs ALTER COLUMN user_id SET DEFAULT auth.uid();
