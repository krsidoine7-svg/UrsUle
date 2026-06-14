-- ═══════════════════════════════════════════════════════════════════
-- Migration 019 : Durcissement des fonctions SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════════════
-- Cette migration corrige la faille de "Search Path Injection" sur
-- les fonctions créées lors des migrations récentes (011 à 016).
-- Le paramètre search_path doit être explicitement défini pour empêcher
-- un attaquant d'exécuter des requêtes malveillantes avec les droits
-- élevés du créateur de la fonction.

-- Migration 011
ALTER FUNCTION public.handle_project_soft_delete() SET search_path = public;

-- Migration 013
ALTER FUNCTION public.handle_folder_soft_delete() SET search_path = public;

-- Migration 014
ALTER FUNCTION public.handle_task_soft_delete_secondary() SET search_path = public;
ALTER FUNCTION public.handle_note_soft_delete_secondary() SET search_path = public;

-- Migration 015
ALTER FUNCTION public.handle_recurring_task() SET search_path = public;

-- Migration 016 (Cron Jobs et Notifications Automatiques)
ALTER FUNCTION public.check_upcoming_deadlines() SET search_path = public;
ALTER FUNCTION public.generate_daily_digest() SET search_path = public;
