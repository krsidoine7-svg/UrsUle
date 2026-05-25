-- Create webhook logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    event TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index
CREATE INDEX IF NOT EXISTS webhook_logs_user_id_idx ON public.webhook_logs(user_id);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own webhook logs"
    ON public.webhook_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook logs"
    ON public.webhook_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook logs"
    ON public.webhook_logs FOR DELETE
    USING (auth.uid() = user_id);
