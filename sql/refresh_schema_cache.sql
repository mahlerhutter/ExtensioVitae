-- Refresh PostgREST Schema Cache
-- Sometimes Supabase doesn't see new columns until cache is refreshed
-- Run this in Supabase SQL Editor

NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache reload requested!' as status;
