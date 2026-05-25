-- Fix webhook_logs table schema to match the code's expectations
-- The table was previously created in 001_init_schema.sql with different column names

DO $$ 
BEGIN
    -- Rename webhook_url to url if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'webhook_url') THEN
        ALTER TABLE public.webhook_logs RENAME COLUMN webhook_url TO url;
    END IF;

    -- Rename event_type to event if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'event_type') THEN
        -- Check if 'event' already exists to avoid conflict
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'event') THEN
            ALTER TABLE public.webhook_logs RENAME COLUMN event_type TO event;
        END IF;
    END IF;

    -- Rename triggered_at to created_at if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'triggered_at') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'created_at') THEN
            ALTER TABLE public.webhook_logs RENAME COLUMN triggered_at TO created_at;
        END IF;
    END IF;

    -- Add error column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'error') THEN
        ALTER TABLE public.webhook_logs ADD COLUMN error TEXT;
    END IF;
    
    -- Ensure success column exists and is BOOLEAN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'success') THEN
        ALTER TABLE public.webhook_logs ALTER COLUMN success SET NOT NULL;
    ELSE
        ALTER TABLE public.webhook_logs ADD COLUMN success BOOLEAN NOT NULL DEFAULT false;
    END IF;

END $$;
