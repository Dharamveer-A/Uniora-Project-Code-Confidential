-- Create the user_documents table (No storage_path needed!)
CREATE TABLE public.user_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    uid UUID REFERENCES public.user_profile(uid) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL,       -- e.g., 'Aadhaar', 'Income Certificate'
    
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    extracted_data JSONB,              -- Will store the AI OCR results
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS for documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own document records
CREATE POLICY "Users can insert own documents" 
ON public.user_documents FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = uid);

-- Allow users to view their own document records
CREATE POLICY "Users can view own documents" 
ON public.user_documents FOR SELECT TO authenticated 
USING (auth.uid() = uid);
