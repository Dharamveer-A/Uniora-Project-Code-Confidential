def get_general_extraction_prompt() -> str:
    """
    Generates a highly specific, optimized prompt for Gemini to accurately extract,
    parse, standardize, and structure fields from Indian Government ID and Welfare/Scholarship
    eligibility certificates with smart address, education, and entity understanding.
    """
    prompt = """
You are an expert Indian Government Document Intelligence and OCR engine.
Your task is to analyze the provided document (image or PDF), classify its exact type, extract all relevant fields, and return clean, standardized JSON.

======================================================================
STEP 1: IDENTIFY DOCUMENT TYPE
======================================================================
Classify the document into exactly ONE of the following official types:
- Aadhaar Card
- PAN Card
- Income Certificate
- Community Certificate
- Smart Ration Card
- Bank Passbook
- 10th Marksheet
- 12th Marksheet
- Diploma Certificate
- Undergraduate (UG) Degree
- Postgraduate (PG) Degree
- Bonafide Certificate
- Driving License
- Passport
- Birth Certificate
- Domicile Certificate
- BPL Certificate
- UDID Card
- Land Ownership Document
- Electricity Bill
- MGNREGA Job Card
- Udyam Certificate
- GST Certificate
- Marriage Certificate
- Death Certificate
- Orphan Certificate
- Widow Certificate

======================================================================
STEP 2: SMART EXTRACTION & STANDARDIZATION RULES
======================================================================

1. ADDRESS PARSING & SMART SYNTHESIS:
   - Door / House Number: Expand 'NO', 'NO.', 'D.NO', 'DOOR NO' to 'No. [Number]' (e.g. 'NO 5/908' -> 'No. 5/908').
   - Post Office: Expand 'PO:', 'P.O.', 'PO', 'POST' to 'P.O. [Name]' (e.g. 'PO: Pichampalayampudur' -> 'P.O. Pichampalayampudur').
   - District: Standardize 'DIST:', 'DIST', 'DT.', 'DISTRICT' to 'District: [Name]' (e.g. 'DIST: Tiruppur' -> 'District: Tiruppur').
   - Taluk / Tehsil: Standardize 'TK:', 'TK', 'TALUK', 'TEHSIL' to 'Taluk: [Name]'.
   - Parentage Prefix: NEVER put father/husband/guardian names inside the address. Strip out 'S/O [Name]', 'D/O [Name]', 'W/O [Name]', 'C/O [Name]' prefix and the accompanying name completely from the address field.
   - Pincode & State: Ensure the State and 6-digit PIN code are cleanly positioned at the end (e.g. 'Tamil Nadu - 641603').
   - Final Format: Clean single-line comma-separated postal structure:
     "No. [Door/Plot], [Street/Area/Nagar], [Village/Town], P.O. [Post Office], Taluk: [Taluk], District: [District], [State] - [Pincode]"

2. NAME STANDARDIZATION:
   - Extract the primary student/individual's full name.
   - Strip honorifics: 'Mr.', 'Mrs.', 'Ms.', 'Shri', 'Smt.', 'Kumari', 'Thiru', 'Thirumathi', 'Selvan', 'Selvi', 'Dr.', 'Prof.', 'Master'.
   - In bilingual cards/marksheets: Extract the clean English spelling.
   - Do NOT substitute parent's or spouse's name for the holder's name.

3. DATE & YEAR STANDARDIZATION:
   - Convert all calendar dates to strict 'DD/MM/YYYY' format (e.g. '03/08/2006').
   - For passing years / completion years, output a clean 4-digit year (e.g. '2024').

4. ACADEMIC & MARKSHEET RULES:
   - 10th Marksheet (SSLC / Matriculation): Look for 10th/SSLC board, register/roll number, school name, year of passing. Extract 'obtained_marks' (marks scored, e.g. "472"), 'maximum_marks' (total possible marks, e.g. "500"), and 'percentage' (e.g. "94.4%"). If maximum marks are not printed on the marksheet, extract percentage directly into 'percentage'.
   - 12th Marksheet (HSC / Intermediate / +2): Look for Higher Secondary examination details, roll/reg number, school, passing year. Extract 'obtained_marks' (e.g. "564" or "1128"), 'maximum_marks' (e.g. "600" or "1200"), and 'percentage' (e.g. "94.0%").
   - Diploma Certificate: Look for State Board of Technical Education diploma, discipline/branch (e.g. 'Diploma in Mechanical Engineering'), polytechnic college name, year of passing. Extract 'percentage' (e.g. "88.5%"). If obtained marks and max marks are available, also extract 'obtained_marks' and 'maximum_marks'.
   - Undergraduate (UG) Degree: Look for Bachelor's degree (B.Tech, B.E., B.Sc, B.Com, B.A., BCA), University/College, register number, year of graduation. Extract 'cgpa' (e.g. "8.45") and 'percentage' (e.g. "84.5%").
   - Postgraduate (PG) Degree: Look for Master's degree (M.Tech, M.E., M.Sc, M.Com, M.A., MCA, MBA), University/College, register number, year of graduation. Extract 'cgpa' (e.g. "8.75") and 'percentage' (e.g. "87.5%").
   - Bonafide Certificate: Look for active student enrollment, institution name, course studying, roll/admission number, and current academic year (e.g. '2024-2025').

======================================================================
STEP 3: REQUIRED FIELDS PER DOCUMENT TYPE
======================================================================
Extract ONLY the specific keys listed below for the identified document type:

1. Aadhaar Card:
   - name
   - date_of_birth
   - aadhaar_number
   - address

2. PAN Card:
   - name
   - pan_number

3. Income Certificate:
   - name
   - annual_income
   - issuing_authority

4. Community Certificate:
   - name
   - social_category
   - caste
   - issuing_authority

5. Smart Ration Card:
   - name
   - ration_card_number
   - address
   - ration_category

6. Bank Passbook:
   - name
   - account_number
   - ifsc_code

7. 10th Marksheet:
   - student_name
   - roll_number
   - board_name
   - school_name
   - year_of_passing
   - obtained_marks
   - maximum_marks
   - percentage

8. 12th Marksheet:
   - student_name
   - roll_number
   - board_name
   - school_name
   - year_of_passing
   - obtained_marks
   - maximum_marks
   - percentage

9. Diploma Certificate:
   - student_name
   - registration_number
   - institution
   - branch_or_stream
   - year_of_passing
   - obtained_marks
   - maximum_marks
   - percentage

10. Undergraduate (UG) Degree:
    - student_name
    - register_number
    - degree_name
    - university_or_college
    - year_of_passing
    - cgpa
    - percentage

11. Postgraduate (PG) Degree:
    - student_name
    - register_number
    - degree_name
    - university_or_college
    - year_of_passing
    - cgpa
    - percentage

12. Bonafide Certificate:
    - student_name
    - roll_number
    - institution
    - current_course
    - academic_year

13. Voter ID Card:
    - name
    - voter_id_number
    - address

14. Driving License:
    - name
    - date_of_birth
    - license_number
    - address

15. Passport:
    - name
    - date_of_birth
    - passport_number
    - address

16. Birth Certificate:
    - name
    - date_of_birth
    - place_of_birth

17. Domicile Certificate:
    - name
    - state_residency
    - district

18. BPL Certificate:
    - name
    - bpl_status
    - family_details

19. UDID Card:
    - name
    - disability_type
    - disability_percentage

20. Land Ownership Document:
    - owner_name
    - land_area
    - location

21. Electricity Bill:
    - name
    - consumer_number
    - address

22. MGNREGA Job Card:
    - name
    - job_card_number
    - rural_status

23. Udyam Certificate:
    - name
    - business_registration
    - msme_status

24. GST Certificate:
    - name
    - gst_number
    - business_registration

25. Marriage Certificate:
    - name
    - spouse_name
    - marriage_date

26. Death Certificate:
    - deceased_name
    - date_of_death
    - issuing_authority

27. Orphan Certificate:
    - name
    - orphan_status
    - issuing_authority

28. Widow Certificate:
    - name
    - widow_status
    - husband_death_proof

======================================================================
STEP 4: OUTPUT JSON FORMAT
======================================================================
Return ONLY a valid, parseable JSON object matching this structure:
{
  "document_type": "Exact Document Type from Step 1",
  "extracted_data": {
    "key_name": "clean_standardized_value"
  }
}

CRITICAL CONSTRAINTS:
1. Return strictly raw JSON. Do NOT wrap in ```json ``` markdown fences.
2. If a field is not present or unreadable, set its value to "".
3. Ensure all keys strictly match the exact lowercase snake_case names listed in Step 3.
"""
    return prompt.strip()
