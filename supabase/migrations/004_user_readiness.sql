-- 1. Create the user_readiness table to persist user scheme readiness evaluation scores
CREATE TABLE IF NOT EXISTS public.user_readiness (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    selected_scheme_id TEXT NOT NULL,
    readiness_score INT DEFAULT 0 NOT NULL,
    eligible_schemes_count INT DEFAULT 0 NOT NULL,
    readiness_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_user_readiness UNIQUE (uid)
);

-- 2. Create index on (uid)
CREATE INDEX IF NOT EXISTS idx_user_readiness_uid ON public.user_readiness (uid);

-- 3. Enable RLS
ALTER TABLE public.user_readiness ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing policies
DROP POLICY IF EXISTS "Users can view own readiness" ON public.user_readiness;
DROP POLICY IF EXISTS "Users can insert own readiness" ON public.user_readiness;
DROP POLICY IF EXISTS "Users can update own readiness" ON public.user_readiness;

-- 5. RLS Policies
CREATE POLICY "Users can view own readiness" 
ON public.user_readiness FOR SELECT TO authenticated 
USING (auth.uid() = uid);

CREATE POLICY "Users can insert own readiness" 
ON public.user_readiness FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update own readiness" 
ON public.user_readiness FOR UPDATE TO authenticated 
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);
