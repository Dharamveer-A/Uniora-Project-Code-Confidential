from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel

router = APIRouter()

# --- Endpoint 1: Process (Does NOT save to DB) ---
@router.post("/process")
def process_document(doc_type: str):
    # In a real app, this would accept a file and run an ML/OCR model.
    # For now, we mock the extracted data based on document type.
    
    extracted = {}
    if "Aadhaar" in doc_type:
        extracted = {
            "full_name": "Antony Rojes",
            "aadhaar_number": "XXXX-XXXX-1234",
            "date_of_birth": "2006-01-03",
            "gender": "Male"
        }
    elif "PAN" in doc_type:
        extracted = {
            "full_name": "Antony Rojes",
            "pan_number": "ABCDE1234F",
            "father_name": "John Doe"
        }
    else:
        extracted = {
            "full_name": "Antony Rojes",
            "document_id": "987654321",
            "issue_date": "2023-05-12"
        }
        
    return {
        "status": "success",
        "message": "OCR Extraction complete. Awaiting user confirmation.",
        "extracted_data": extracted
    }


from backend.supabase.client import supabase

# --- Endpoint 2: Confirm and Store in DB ---
class ConfirmDocumentRequest(BaseModel):
    document_type: str
    extracted_data: dict

@router.post("/confirm")
def confirm_document(req: ConfirmDocumentRequest):
    # Hardcoded UID of "Antony Rojes" from your user_profile table for testing
    # In production, this comes from the authenticated user's JWT token
    test_uid = "b034b961-b8f1-4870-b7ca-02c8c8fcfdc7"

    try:
        # Insert into Supabase
        response = supabase.table("user_documents").insert({
            "uid": test_uid,
            "document_type": req.document_type,
            "verification_status": "verified",
            "extracted_data": req.extracted_data
        }).execute()
        
        return {
            "status": "success",
            "message": f"{req.document_type} verified and stored successfully!",
            "data": response.data
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
