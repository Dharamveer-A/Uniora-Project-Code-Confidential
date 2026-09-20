import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# We need the user to fill these in their .env file
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project-id.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
