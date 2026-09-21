-- 1. Create the user_documents table with is_verified boolean
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL,                -- e.g., 'Aadhaar Card', 'Income Certificate'
    is_verified BOOLEAN DEFAULT false NOT NULL, -- Boolean flag: true = verified, false = pending
    extracted_data JSONB DEFAULT '{}'::jsonb,   -- Stores the AI extracted key-value fields
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index on (uid, document_type) for fast querying
CREATE INDEX IF NOT EXISTS idx_user_documents_uid_type 
ON public.user_documents (uid, document_type);

-- 3. Turn on RLS for documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing policies for idempotent re-runs
DROP POLICY IF EXISTS "Users can insert own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.user_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.user_documents;

-- 5. Set RLS Policies
-- Allow users to insert their own document records
CREATE POLICY "Users can insert own documents" 
ON public.user_documents FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = uid);

-- Allow users to view their own document records
CREATE POLICY "Users can view own documents" 
ON public.user_documents FOR SELECT TO authenticated 
USING (auth.uid() = uid);

-- Allow users to update their own document records
CREATE POLICY "Users can update own documents" 
ON public.user_documents FOR UPDATE TO authenticated 
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

-- Allow users to delete their own document records
CREATE POLICY "Users can delete own documents" 
ON public.user_documents FOR DELETE TO authenticated 
USING (auth.uid() = uid);
