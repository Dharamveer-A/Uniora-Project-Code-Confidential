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

loaded_features = []

# Feature 03: Documents Verification Router
try:
    spec_docs = importlib.util.spec_from_file_location(
        "documents", 
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "features", "03_documents_verification", "backend", "documents.py")
    )
    documents_module = importlib.util.module_from_spec(spec_docs)
    spec_docs.loader.exec_module(documents_module)
    app.include_router(documents_module.router, prefix="/api/documents", tags=["Document Verification"])
    loaded_features.append("03_documents_verification")
except Exception as e:
    print(f"[UNIORA Backend] Notice: Feature 03 Documents Verification router not loaded: {e}")

# Feature 04: Eligible Schemes Router
try:
    spec_schemes = importlib.util.spec_from_file_location(
        "schemes",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "features", "04_eligible_schemes", "backend", "schemes.py")
    )
    schemes_module = importlib.util.module_from_spec(spec_schemes)
    spec_schemes.loader.exec_module(schemes_module)
    app.include_router(schemes_module.router, prefix="/api/schemes", tags=["Eligible Schemes"])
    loaded_features.append("04_eligible_schemes")
except Exception as e:
    print(f"[UNIORA Backend] Notice: Feature 04 Eligible Schemes router not loaded: {e}")

@app.get("/")
def read_root():
    return {"message": "UNIORA Backend is running", "features": loaded_features}
