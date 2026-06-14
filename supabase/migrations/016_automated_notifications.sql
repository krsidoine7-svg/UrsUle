-- Création des fonctions de notifications automatiques
CREATE OR REPLACE FUNCTION public.check_upcoming_deadlines()
RETURNS VOID AS $$
DECLARE
  v_task RECORD;
BEGIN
  -- Parcourir toutes les tâches actives arrivant à échéance dans 1 heure (entre 50 min et 65 min)
  FOR v_task IN 
    SELECT t.id, t.title, t.user_id, t.deadline
    FROM public.tasks t
    WHERE t.status IN ('todo', 'in_progress')
      AND t.deleted_at IS NULL
      AND t.deadline IS NOT NULL
      AND t.deadline BETWEEN (NOW() + INTERVAL '50 minutes') AND (NOW() + INTERVAL '65 minutes')
  LOOP
    -- Vérifier s'il n'y a pas déjà une notification similaire pour éviter les doublons
    IF NOT EXISTS (
      SELECT 1 
      FROM public.notifications 
      WHERE user_id = v_task.user_id 
        AND related_entity_id = v_task.id 
        AND type = 'warning'
        AND created_at > (NOW() - INTERVAL '3 hours')
    ) THEN
      -- Insérer la notification
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_entity_id,
        related_entity_type
      ) VALUES (
        v_task.user_id,
        'Échéance proche ⏰',
        'La tâche "' || v_task.title || '" arrive à échéance dans 1 heure.',
        'warning',
        v_task.id,
        'task'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour le bilan quotidien
CREATE OR REPLACE FUNCTION public.generate_daily_digest()
RETURNS VOID AS $$
DECLARE
  v_profile RECORD;
  v_count_today INTEGER;
  v_count_overdue INTEGER;
BEGIN
  -- Parcourir tous les profils utilisateurs actifs
  FOR v_profile IN 
    SELECT p.id 
    FROM public.profiles p
  LOOP
    -- Compter les tâches prévues pour aujourd'hui (deadline est aujourd'hui et non terminée)
    SELECT COUNT(*) INTO v_count_today
    FROM public.tasks t
    WHERE t.user_id = v_profile.id
      AND t.status IN ('todo', 'in_progress')
      AND t.deleted_at IS NULL
      AND t.deadline IS NOT NULL
      AND t.deadline::date = CURRENT_DATE;

    -- Compter les tâches en retard (deadline dépassée et non terminée)
    SELECT COUNT(*) INTO v_count_overdue
    FROM public.tasks t
    WHERE t.user_id = v_profile.id
      AND t.status IN ('todo', 'in_progress')
      AND t.deleted_at IS NULL
      AND t.deadline IS NOT NULL
      AND t.deadline < NOW()
      AND t.deadline::date != CURRENT_DATE;

    -- S'il y a des tâches aujourd'hui ou en retard, créer une notification digest
    IF v_count_today > 0 OR v_count_overdue > 0 THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
      ) VALUES (
        v_profile.id,
        'Bilan du jour 📅',
        'Tu as ' || v_count_today || ' tâche(s) prévue(s) aujourd''hui et ' || v_count_overdue || ' tâche(s) en retard. Productivité maximale !',
        'info'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer pg_cron si non fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer les anciens jobs s'ils existent (méthode sécurisée)
DO $$
BEGIN
  PERFORM cron.unschedule('check-deadlines-every-5-min');
EXCEPTION WHEN OTHERS THEN
  -- Ignorer l'erreur si le job n'existe pas
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-digest-at-8-am');
EXCEPTION WHEN OTHERS THEN
  -- Ignorer l'erreur si le job n'existe pas
END;
$$;

-- Enregistrer le job de vérification des deadlines toutes les 5 minutes
SELECT cron.schedule(
  'check-deadlines-every-5-min',
  '*/5 * * * *',
  $$ SELECT public.check_upcoming_deadlines(); $$
);

-- Enregistrer le job de digest quotidien à 8h00 Africa/Abidjan (UTC+0)
SELECT cron.schedule(
  'daily-digest-at-8-am',
  '0 8 * * *',
  $$ SELECT public.generate_daily_digest(); $$
);
