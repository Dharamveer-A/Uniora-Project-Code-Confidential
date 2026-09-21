from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import importlib.util
from dotenv import load_dotenv

# Load .env automatically so API keys work
load_dotenv()

app = FastAPI(title="UNIORA Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

spec = importlib.util.spec_from_file_location(
    "documents", 
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "features", "03_documents_verification", "backend", "documents.py")
)
documents_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(documents_module)

app.include_router(documents_module.router, prefix="/api/documents")

@app.get("/")
def read_root():
    return {"message": "UNIORA Backend is running"}
