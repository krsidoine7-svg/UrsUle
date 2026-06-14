-- Création de la fonction de récurrence
CREATE OR REPLACE FUNCTION public.handle_recurring_task()
RETURNS TRIGGER AS $$
DECLARE
  v_new_deadline TIMESTAMPTZ;
  v_parent_id UUID;
BEGIN
  -- Déclenché uniquement lors du passage à 'done'
  IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.recurrence_type IS NOT NULL AND NEW.recurrence_type != 'none' THEN
    
    -- Calculer la date de la prochaine échéance (deadline)
    IF NEW.deadline IS NOT NULL THEN
      IF NEW.recurrence_type = 'daily' THEN
        v_new_deadline := NEW.deadline + INTERVAL '1 day';
      ELSIF NEW.recurrence_type = 'weekly' THEN
        v_new_deadline := NEW.deadline + INTERVAL '1 week';
      ELSIF NEW.recurrence_type = 'monthly' THEN
        v_new_deadline := NEW.deadline + INTERVAL '1 month';
      ELSE
        v_new_deadline := NEW.deadline + INTERVAL '1 day'; -- Fallback
      END IF;
    ELSE
      -- Fallback si aucune échéance n'était définie
      IF NEW.recurrence_type = 'daily' THEN
        v_new_deadline := NOW() + INTERVAL '1 day';
      ELSIF NEW.recurrence_type = 'weekly' THEN
        v_new_deadline := NOW() + INTERVAL '1 week';
      ELSIF NEW.recurrence_type = 'monthly' THEN
        v_new_deadline := NOW() + INTERVAL '1 month';
      ELSE
        v_new_deadline := NOW() + INTERVAL '1 day';
      END IF;
    END IF;

    -- Identifier le parent originel de la récurrence
    IF NEW.recurrence_parent_id IS NULL THEN
      v_parent_id := NEW.id;
    ELSE
      v_parent_id := NEW.recurrence_parent_id;
    END IF;

    -- Insérer la copie pour la prochaine occurrence
    INSERT INTO public.tasks (
      user_id,
      project_id,
      category_id,
      title,
      description,
      description_json,
      status,
      priority,
      estimated_duration_minutes,
      actual_duration_minutes,
      start_date,
      deadline,
      recurrence_type,
      recurrence_config,
      recurrence_parent_id,
      is_pinned,
      color,
      tags,
      validation_type,
      validation_question,
      validation_answer,
      webhook_url
    ) VALUES (
      NEW.user_id,
      NEW.project_id,
      NEW.category_id,
      NEW.title,
      NEW.description,
      NEW.description_json,
      'todo',
      NEW.priority,
      NEW.estimated_duration_minutes,
      0, -- Reset de la durée accumulée
      NULL, -- Reset de la date de démarrage
      v_new_deadline,
      NEW.recurrence_type,
      NEW.recurrence_config,
      v_parent_id,
      NEW.is_pinned,
      NEW.color,
      NEW.tags,
      NEW.validation_type,
      NEW.validation_question,
      NEW.validation_answer,
      NEW.webhook_url
    );

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Liaison du trigger
DROP TRIGGER IF EXISTS trigger_handle_recurring_task ON public.tasks;
CREATE TRIGGER trigger_handle_recurring_task
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_recurring_task();
