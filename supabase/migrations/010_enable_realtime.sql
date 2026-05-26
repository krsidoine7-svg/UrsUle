-- Create publication if it doesn't exist, then add tables to enable Supabase Realtime idempotently
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Enable Realtime replication safely only for tables not already subscribed
do $$
begin
  -- For 'tasks'
  if not exists (
    select 1 
    from pg_publication_rel pr 
    join pg_class c on pr.prrelid = c.oid 
    join pg_publication p on pr.prpubid = p.oid 
    where p.pubname = 'supabase_realtime' and c.relname = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;

  -- For 'projects'
  if not exists (
    select 1 
    from pg_publication_rel pr 
    join pg_class c on pr.prrelid = c.oid 
    join pg_publication p on pr.prpubid = p.oid 
    where p.pubname = 'supabase_realtime' and c.relname = 'projects'
  ) then
    alter publication supabase_realtime add table projects;
  end if;

  -- For 'time_sessions'
  if not exists (
    select 1 
    from pg_publication_rel pr 
    join pg_class c on pr.prrelid = c.oid 
    join pg_publication p on pr.prpubid = p.oid 
    where p.pubname = 'supabase_realtime' and c.relname = 'time_sessions'
  ) then
    alter publication supabase_realtime add table time_sessions;
  end if;
end $$;
