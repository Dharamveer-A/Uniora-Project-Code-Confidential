/* ==========================================================================
   UNIORA PLATFORM - SUPABASE CLIENT INITIALIZATION
   File: common/js/supabase.js
   Shared Supabase client instance for frontend authentication & database queries.
   ========================================================================== */

// Public Supabase Credentials (Anon / Publishable Key Only)
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://dnbtrqbkrxsdwtrscmzi.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 'sb_publishable_NOIO-C90_B8uoGM8kwnetw_mLP4kfdB';

// Initialize Supabase Client (Using global Supabase library or ES Module)
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const supabase = supabaseClient;
export default supabase;