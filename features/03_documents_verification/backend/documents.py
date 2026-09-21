import re

def refine_extracted_fields(extracted: dict) -> dict:
    """
    Intelligently standardizes and formats extracted document fields,
    especially Indian postal addresses, ID numbers, and names.
    """
    cleaned = {}
    for k, v in extracted.items():
        if v is None:
            cleaned[k] = ""
            continue
        val = str(v).strip()

        # 1. Smart Address Processing
        if k == "address":
            # Strip S/O, D/O, W/O, C/O prefix and name if it leaked into the address
            val = re.sub(r'^(?:S/O|D/O|W/O|C/O|SO|DO|WO|CO)\s*[:\-]?\s*[^,]+,\s*', '', val, flags=re.IGNORECASE)
            # Expand common abbreviations cleanly
            val = re.sub(r'\b(NO|NO\.|D\.NO|D\.NO\.|DOOR NO|DOOR NO\.)\s*[:\-]?\s*', 'No. ', val, flags=re.IGNORECASE)
            val = re.sub(r'\b(PO|P\.O|P\.O\.|POST)\s*[:\-]?\s*', 'P.O. ', val, flags=re.IGNORECASE)
            val = re.sub(r'\b(DIST|DIST\.|DT|DT\.|DISTRICT)\s*[:\-]?\s*', 'District: ', val, flags=re.IGNORECASE)
            val = re.sub(r'\b(TK|TK\.|TALUK|TEHSIL)\s*[:\-]?\s*', 'Taluk: ', val, flags=re.IGNORECASE)
            # Normalize multiple spaces, commas, and line breaks
            val = re.sub(r'[\r\n]+', ', ', val)
            val = re.sub(r'\s*,\s*', ', ', val)
            val = re.sub(r'(?:,\s*)+', ', ', val)
            val = re.sub(r'\s{2,}', ' ', val).strip(' ,')

        # 2. Aadhaar standard 4-digit grouping
        elif k == "aadhaar_number":
            digits = re.sub(r'\D', '', val)
            if len(digits) == 12:
                val = f"{digits[:4]} {digits[4:8]} {digits[8:]}"

        # 3. Uppercase standard ID codes
        elif k in ("pan_number", "voter_id_number", "ifsc_code", "gst_number"):
            val = re.sub(r'\s+', '', val).upper()

        cleaned[k] = val

    # 4. Smart Academic Marks & Percentage calculation/normalization
    # Handle composite "485/500" strings if they leaked into fields
    composite_str = cleaned.get("marks_or_percentage") or cleaned.get("marks") or cleaned.get("obtained_marks", "")
    if composite_str and "/" in composite_str:
        match = re.search(r'(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)', composite_str)
        if match:
            obt_val, max_val = match.group(1), match.group(2)
            if not cleaned.get("obtained_marks") or "/" in cleaned.get("obtained_marks", ""):
                cleaned["obtained_marks"] = obt_val
            if not cleaned.get("maximum_marks"):
                cleaned["maximum_marks"] = max_val

    # Auto calculate percentage if obtained and maximum marks exist
    try:
        obt_raw = re.sub(r'[^\d.]', '', str(cleaned.get("obtained_marks", "")))
        max_raw = re.sub(r'[^\d.]', '', str(cleaned.get("maximum_marks", "")))
        if obt_raw and max_raw:
            obt_num = float(obt_raw)
            max_num = float(max_raw)
            if max_num > 0 and obt_num <= max_num and not cleaned.get("percentage"):
                pct = (obt_num / max_num) * 100
                cleaned["percentage"] = f"{pct:.2f}%"
    except Exception:
        pass

    # Strip leading zeroes from marks (e.g. "0517" -> "517", "0600" -> "600")
    if cleaned.get("obtained_marks"):
        cleaned["obtained_marks"] = re.sub(r'^0+(?=\d)', '', str(cleaned["obtained_marks"]).strip())
    if cleaned.get("maximum_marks"):
        cleaned["maximum_marks"] = re.sub(r'^0+(?=\d)', '', str(cleaned["maximum_marks"]).strip())

    # Normalize percentage formatting (ensure % symbol at end)
    if cleaned.get("percentage"):
        pct_val = cleaned["percentage"].strip()
        pct_clean = re.sub(r'[^\d.]', '', pct_val)
        if pct_clean:
            cleaned["percentage"] = f"{pct_clean}%"

    # Clean CGPA (extract clean decimal e.g. "8.45" from "8.45 CGPA" or "8.45/10")
    if cleaned.get("cgpa"):
        cgpa_val = cleaned["cgpa"].strip()
        match_cgpa = re.search(r'(\d+(?:\.\d+)?)', cgpa_val)
        if match_cgpa:
            cleaned["cgpa"] = match_cgpa.group(1)

    return cleaned

from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Request
from pydantic import BaseModel
import io
import json
import os
import random
from google import genai
from google.genai import types
import importlib.util

# Dynamically load prompts.py because folder starts with a number (03_)
prompt_path = os.path.join(os.path.dirname(__file__), "prompts.py")
spec = importlib.util.spec_from_file_location("prompts_module", prompt_path)
prompts_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prompts_module)
get_general_extraction_prompt = prompts_module.get_general_extraction_prompt

router = APIRouter()

# Global list of keys for round-robin / random selection
def get_api_keys():
    # Support both GEMINI_API_KEYS and GEMINI_API_KEY as comma-separated lists
    raw_keys = os.environ.get("GEMINI_API_KEYS") or os.environ.get("GEMINI_API_KEY")
    if raw_keys:
        return [k.strip() for k in raw_keys.split(",") if k.strip()]
    return []

def get_image_mime_type(filename: str) -> str:
    """Determine MIME type based on file extension."""
    ext = filename.lower().split(".")[-1]
    mime_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "heic": "image/heic",
        "heif": "image/heif",
        "pdf": "application/pdf",
    }
    return mime_map.get(ext, "image/jpeg")

@router.post("/process")
async def process_document(file: UploadFile = File(...)):
    file_bytes = await file.read()
    print(f"Received file: {file.filename} (Size: {len(file_bytes)} bytes)")

    keys_list = get_api_keys()
    if not keys_list:
        return {
            "status": "error",
            "message": "Missing GEMINI_API_KEYS or GEMINI_API_KEY in .env.",
            "document_type": "Unknown",
            "extracted_data": {}
        }

    prompt = get_general_extraction_prompt()
    mime_type = get_image_mime_type(file.filename)
    image_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)

    # Retry across all keys on 503/429 (temporary overload)
    import time
    random.shuffle(keys_list)   # randomise order each request
    last_error = None

    models_to_try = ['gemini-3.5-flash-lite', 'gemini-3.6-flash']

    for attempt, key in enumerate(keys_list):
        for model_name in models_to_try:
            try:
                print(f"Attempt {attempt + 1} with model {model_name} using key ending ...{key[-6:]}")
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    )
                )
                print(f"Gemini raw response: {response.text[:300]}")
                result    = json.loads(response.text)
                doc_type  = result.get("document_type", "Unknown Document")
                raw_extracted = result.get("extracted_data", {})

                # Normalize Document Type aliases
                doc_type_map = {
                    "10th marksheet": "10th Marksheet",
                    "sslc marksheet": "10th Marksheet",
                    "10th standard": "10th Marksheet",
                    "10th certificate": "10th Marksheet",
                    "secondary school certificate": "10th Marksheet",
                    "matriculation certificate": "10th Marksheet",
                    "class 10 marksheet": "10th Marksheet",
                    "12th marksheet": "12th Marksheet",
                    "hsc marksheet": "12th Marksheet",
                    "12th certificate": "12th Marksheet",
                    "+2 marksheet": "12th Marksheet",
                    "intermediate marksheet": "12th Marksheet",
                    "higher secondary certificate": "12th Marksheet",
                    "diploma certificate": "Diploma Certificate",
                    "polytechnic diploma": "Diploma Certificate",
                    "polytechnic certificate": "Diploma Certificate",
                    "undergraduate (ug) degree": "Undergraduate (UG) Degree",
                    "ug degree": "Undergraduate (UG) Degree",
                    "bachelor degree": "Undergraduate (UG) Degree",
                    "undergraduate degree": "Undergraduate (UG) Degree",
                    "postgraduate (pg) degree": "Postgraduate (PG) Degree",
                    "pg degree": "Postgraduate (PG) Degree",
                    "master degree": "Postgraduate (PG) Degree",
                    "postgraduate degree": "Postgraduate (PG) Degree",
                    "bonafide certificate": "Bonafide Certificate",
                    "student bonafide": "Bonafide Certificate",
                }
                clean_doc_type = str(doc_type).lower().strip()
                normalized_doc_type = doc_type_map.get(clean_doc_type, doc_type)
                
                # Normalize keys to ensure 100% match with frontend form field IDs
                normalized_extracted = {}
                key_aliases = {
                    "epic_number": "voter_id_number",
                    "epic_no": "voter_id_number",
                    "voter_id": "voter_id_number",
                    "epic": "voter_id_number",
                    "aadhaar": "aadhaar_number",
                    "aadhaar_no": "aadhaar_number",
                    "uid_number": "aadhaar_number",
                    "pan": "pan_number",
                    "pan_no": "pan_number",
                    "dob": "date_of_birth",
                    "birth_date": "date_of_birth",
                    "income": "annual_income",
                    "income_amount": "annual_income",
                    "caste_category": "social_category",
                    "category": "social_category",
                    "ration_card_no": "ration_card_number",
                    "ration_no": "ration_card_number",
                    "dl_number": "license_number",
                    "driving_license_number": "license_number",
                    "degree": "degree_name",
                    "degree_name": "degree_name",
                    "course": "degree_name",
                    "current_course": "current_course",
                    "passing_year": "year_of_passing",
                    "completion_year": "year_of_passing",
                    "year": "year_of_passing",
                    "roll_no": "roll_number",
                    "roll_num": "roll_number",
                    "roll": "roll_number",
                    "register_no": "register_number",
                    "reg_no": "register_number",
                    "reg_number": "register_number",
                    "registration_no": "registration_number",
                    "board": "board_name",
                    "school": "school_name",
                    "college": "university_or_college",
                    "university": "university_or_college",
                    "college_or_university": "university_or_college",
                    "branch": "branch_or_stream",
                    "stream": "branch_or_stream",
                    "department": "branch_or_stream",
                    "marks_obtained": "obtained_marks",
                    "mark_obtained": "obtained_marks",
                    "obtained_mark": "obtained_marks",
                    "secured_marks": "obtained_marks",
                    "marks_scored": "obtained_marks",
                    "total_marks_obtained": "obtained_marks",
                    "score": "obtained_marks",
                    "maximum_mark": "maximum_marks",
                    "max_marks": "maximum_marks",
                    "max_mark": "maximum_marks",
                    "total_marks": "maximum_marks",
                    "total_mark": "maximum_marks",
                    "out_of": "maximum_marks",
                    "out_of_marks": "maximum_marks",
                    "percent": "percentage",
                    "percentage": "percentage",
                    "marks_percentage": "percentage",
                    "overall_percentage": "percentage",
                    "cgpa": "cgpa",
                    "gpa": "cgpa",
                    "cumulative_gpa": "cgpa",
                    "grade_point": "cgpa",
                    "academic_year": "academic_year",
                }
                for k, v in raw_extracted.items():
                    clean_k = str(k).lower().strip().replace(" ", "_")
                    target_k = key_aliases.get(clean_k, clean_k)
                    # If document is educational and returned key is 'name', map to 'student_name'
                    if target_k == "name" and any(term in normalized_doc_type.lower() for term in ["marksheet", "degree", "diploma", "bonafide"]):
                        target_k = "student_name"
                    normalized_extracted[target_k] = str(v).strip() if v is not None else ""

                # Apply smart formatting and entity refinement
                final_extracted = refine_extracted_fields(normalized_extracted)

                return {
                    "status": "success",
                    "message": f"Gemini successfully processed {file.filename}!",
                    "document_type": normalized_doc_type,
                    "extracted_data": final_extracted,
                }
            except Exception as e:
                last_error = e
                err_str = str(e)
                print(f"Model {model_name} on key ...{key[-6:]} failed: {err_str}")
                if "404" in err_str and "model" in err_str.lower():
                    # Try next model in list immediately
                    continue
                if "503" in err_str or "429" in err_str or "UNAVAILABLE" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    time.sleep(1.0)
                    continue
                break

    print(f"All keys exhausted. Last error: {last_error}")
    return {
        "status": "error",
        "message": f"AI extraction failed: {str(last_error)}",
        "extracted_data": {},
        "document_type": "Unknown Document"
    }


class ConfirmDocumentRequest(BaseModel):
    document_type: str
    extracted_data: dict

@router.get("/list")
async def list_user_documents(request: Request):
    from backend.supabase.client import supabase

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {"status": "error", "message": "Missing Authorization token", "documents": []}

    token = auth_header.split(" ", 1)[1]
    try:
        user_response = supabase.auth.get_user(token)
        uid = user_response.user.id
    except Exception as e:
        return {"status": "error", "message": f"Authentication failed: {str(e)}", "documents": []}

    try:
        supabase.postgrest.auth(token)
        res = supabase.table("user_documents").select("*").eq("uid", uid).execute()
        return {"status": "success", "documents": res.data or []}
    except Exception as e:
        return {"status": "error", "message": f"Failed to fetch documents: {str(e)}", "documents": []}

@router.post("/confirm")
async def confirm_document(req: ConfirmDocumentRequest, request: Request):
    from backend.supabase.client import supabase

    # Extract real user UID from the Authorization JWT token sent by the browser
    uid = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            user_response = supabase.auth.get_user(token)
            uid = user_response.user.id
        except Exception as e:
            print(f"JWT parse error: {e}")

    if not uid:
        return {"status": "error", "message": "Not authenticated. Please log in first."}

    try:
        # Pass the user's JWT token to PostgREST so auth.uid() is populated and RLS policy passes
        supabase.postgrest.auth(token)

        payload = {
            "uid": uid,
            "document_type": req.document_type,
            "is_verified": True,
            "extracted_data": req.extracted_data
        }

        # Check if record already exists to handle both insert & update gracefully
        existing = supabase.table("user_documents").select("id").eq("uid", uid).eq("document_type", req.document_type).execute()
        if existing.data and len(existing.data) > 0:
            doc_id = existing.data[0]["id"]
            response = supabase.table("user_documents").update(payload).eq("id", doc_id).execute()
        else:
            response = supabase.table("user_documents").insert(payload).execute()

        return {
            "status": "success",
            "message": f"{req.document_type} saved successfully!",
            "data": response.data
        }
    except Exception as e:
        print(f"Supabase insert error: {e}")
        return {
            "status": "error",
            "message": f"Failed to save to database: {str(e)}"
        }


class RemoveDocumentRequest(BaseModel):
    document_type: str


@router.post("/remove")
async def remove_document(req: RemoveDocumentRequest, request: Request):
    from backend.supabase.client import supabase

    uid = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            user_response = supabase.auth.get_user(token)
            uid = user_response.user.id
        except Exception as e:
            print(f"JWT parse error: {e}")

    if not uid:
        return {"status": "error", "message": "Not authenticated. Please log in first."}

    try:
        supabase.postgrest.auth(token)
        response = supabase.table("user_documents").delete().eq("uid", uid).eq("document_type", req.document_type).execute()
        return {
            "status": "success",
            "message": f"{req.document_type} removed successfully!",
            "data": response.data
        }
    except Exception as e:
        print(f"Supabase delete error: {e}")
        return {
            "status": "error",
            "message": f"Failed to delete document from database: {str(e)}"
        }

