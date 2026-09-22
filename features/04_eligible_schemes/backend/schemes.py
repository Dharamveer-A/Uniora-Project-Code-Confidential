"""
UNIORA Feature 04: Eligible Schemes - FastAPI Backend Router
Handles schemes data ingestion, demographic criteria evaluation, and document readiness matching.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import urllib.request
import csv
import io
import re
import logging

logger = logging.getLogger("uniora.schemes")

router = APIRouter()

# ---------------------------------------------------------------------------
# PYDANTIC DATA MODELS
# ---------------------------------------------------------------------------

class UserProfileRequest(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = ""
    state: Optional[str] = ""
    district: Optional[str] = ""
    residence: Optional[str] = ""
    occupation: Optional[str] = ""
    annual_income: Optional[float] = None
    income_range: Optional[str] = ""
    social_category: Optional[str] = ""
    marital_status: Optional[str] = ""
    disability: Optional[str] = "No"
    education: Optional[str] = ""
    employment: Optional[str] = ""
    special: Optional[str] = "None"
    percentage: Optional[float] = None
    verified_documents: List[str] = Field(default_factory=list)

class ConditionDetail(BaseModel):
    key: str
    label: str
    satisfied: bool
    reason: str

class DocumentReadiness(BaseModel):
    total_required: int
    verified_count: int
    missing_count: int
    readiness_percentage: int
    verified_docs: List[str]
    missing_docs: List[str]

class EvaluatedSchemeResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    sub_title: str
    issuing_department: str
    level: str
    description: str
    benefits: Optional[str] = None
    application_url: Optional[str] = None
    required_documents: List[str]
    eligible: bool
    evaluated: bool
    match_score: int
    satisfied_conditions: List[ConditionDetail]
    failed_conditions: List[ConditionDetail]
    document_readiness: DocumentReadiness

class EvaluationSummary(BaseModel):
    total_schemes: int
    eligible_count: int
    profile_used: Dict[str, Any]
    verified_documents_used: List[str]

class FullEvaluationResponse(BaseModel):
    summary: EvaluationSummary
    eligible_schemes: List[EvaluatedSchemeResponse]
    all_schemes: List[EvaluatedSchemeResponse]

# ---------------------------------------------------------------------------
# EMBEDDED HIGH-QUALITY SCHEMES FALLBACK DATASET
# ---------------------------------------------------------------------------

EMBEDDED_SCHEMES = [
    {
        "scheme_id": "TN-HE-001",
        "scheme_name": "Tamil Pudhalvan Scheme",
        "sub_title": "₹1,000 monthly higher education stipend for male students",
        "issuing_department": "Higher Education (Tamil Nadu)",
        "level": "Tamil Nadu",
        "min_age": 17,
        "max_age": 25,
        "income_limit_annual": 300000.0,
        "gender": "Male",
        "social_category": "All",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "Student",
        "required_documents": ["Aadhaar Card", "Bonafide Certificate", "Bank Passbook", "12th Marksheet"],
        "description": "Provides ₹1,000/month direct bank transfer to boys who studied in TN Government Schools (6th-12th) and are pursuing higher education.",
        "benefits": "₹1,000 per month direct bank transfer throughout undergraduate course duration.",
        "application_url": "https://www.tn.gov.in"
    },
    {
        "scheme_id": "TN-SW-002",
        "scheme_name": "Pudhumai Penn Scheme (Moovalur Ramamirtham)",
        "sub_title": "₹1,000 monthly higher education assistance for girl students",
        "issuing_department": "Social Welfare & Women Rights (TN)",
        "level": "Tamil Nadu",
        "min_age": 17,
        "max_age": 26,
        "income_limit_annual": 350000.0,
        "gender": "Female",
        "social_category": "All",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "Student",
        "required_documents": ["Aadhaar Card", "Bonafide Certificate", "Bank Passbook", "10th Marksheet"],
        "description": "Financial assistance of ₹1,000/month for girl students from government schools pursuing degree or diploma courses.",
        "benefits": "₹1,000/month direct bank transfer until degree completion.",
        "application_url": "https://www.penkalvi.tn.gov.in"
    },
    {
        "scheme_id": "TN-SD-003",
        "scheme_name": "Naan Mudhalvan Scheme",
        "sub_title": "Industry-aligned skill development and job placement program",
        "issuing_department": "Skill Development & Employment (TN)",
        "level": "Tamil Nadu",
        "min_age": 17,
        "max_age": 29,
        "income_limit_annual": 1000000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "Student",
        "required_documents": ["Aadhaar Card", "Bonafide Certificate"],
        "description": "Comprehensive platform offering free technical training, language skills, and industry placement tracks across colleges.",
        "benefits": "Free certification courses, industry hackathons, and placement assistance.",
        "application_url": "https://www.naanmudhalvan.tn.gov.in"
    },
    {
        "scheme_id": "TN-SW-004",
        "scheme_name": "Kalaignar Magalir Urimai Thogai",
        "sub_title": "₹1,000/month basic income entitlement for female family heads",
        "issuing_department": "Social Welfare & Women Rights (TN)",
        "level": "Tamil Nadu",
        "min_age": 21,
        "max_age": 65,
        "income_limit_annual": 250000.0,
        "gender": "Female",
        "social_category": "All",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "All",
        "required_documents": ["Smart Ration Card", "Aadhaar Card", "Electricity Bill", "Bank Passbook"],
        "description": "Monthly financial entitlement of ₹1,000 to eligible women heads of households meeting economic criteria.",
        "benefits": "₹1,000 direct benefit transfer on the 15th of every month.",
        "application_url": "https://kmut.tn.gov.in"
    },
    {
        "scheme_id": "TN-RD-005",
        "scheme_name": "Kalaignar Kanavu Illam",
        "sub_title": "Reconstruction and building of safe concrete houses in rural TN",
        "issuing_department": "Rural Development",
        "level": "Tamil Nadu",
        "min_age": 21,
        "max_age": 75,
        "income_limit_annual": 200000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "All",
        "required_documents": ["Land Ownership Document", "Income Certificate", "Smart Ration Card", "Aadhaar Card"],
        "description": "State housing program providing unit subsidies to transform huts and katcha houses into permanent concrete homes.",
        "benefits": "₹3.5 Lakh financial unit grant for house construction.",
        "application_url": "https://tnrd.tn.gov.in"
    },
    {
        "scheme_id": "TN-BC-006",
        "scheme_name": "Post-Matric Scholarship for BC / MBC Students",
        "sub_title": "Government tuition & maintenance grant for college study",
        "issuing_department": "Backward Classes & Minorities Welfare (TN)",
        "level": "Tamil Nadu",
        "min_age": 17,
        "max_age": 30,
        "income_limit_annual": 250000.0,
        "gender": "All",
        "social_category": "OBC",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "Student",
        "required_documents": ["Community Certificate", "Income Certificate", "Bonafide Certificate", "12th Marksheet", "Bank Passbook"],
        "description": "Full tuition waiver and maintenance allowances for eligible BC/MBC students in recognized colleges.",
        "benefits": "Tuition fees reimbursement and monthly maintenance allowances.",
        "application_url": "https://bcmbcmw.tn.gov.in"
    },
    {
        "scheme_id": "GOI-MNRE-007",
        "scheme_name": "PM Surya Ghar: Muft Bijli Yojana",
        "sub_title": "Up to 300 units free monthly solar electricity for homes",
        "issuing_department": "Ministry of New & Renewable Energy",
        "level": "Central",
        "min_age": 18,
        "max_age": 80,
        "income_limit_annual": 1500000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "All",
        "occupation_criteria": "All",
        "required_documents": ["Electricity Bill", "Aadhaar Card", "Bank Passbook"],
        "description": "Central subsidy scheme providing financial assistance of up to ₹78,000 for installing rooftop solar systems.",
        "benefits": "Direct subsidy of ₹30,000 to ₹78,000 credited to bank account.",
        "application_url": "https://pmsuryaghar.gov.in"
    },
    {
        "scheme_id": "GOI-MSME-008",
        "scheme_name": "PM Vishwakarma Scheme",
        "sub_title": "Collateral-free subsidized credit & toolkit grants for traditional artisans",
        "issuing_department": "Ministry of MSME",
        "level": "Central",
        "min_age": 18,
        "max_age": 60,
        "income_limit_annual": 400000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "All",
        "occupation_criteria": "Daily Wage / Artisan",
        "required_documents": ["Aadhaar Card", "Bank Passbook", "Smart Ration Card"],
        "description": "End-to-end support to traditional artisans and craftspeople with toolkit incentive of ₹15,000 and low-interest loans.",
        "benefits": "₹15,000 e-voucher toolkit grant and collateral-free enterprise loan up to ₹3 Lakh at 5% interest.",
        "application_url": "https://pmvishwakarma.gov.in"
    },
    {
        "scheme_id": "GOI-HFW-009",
        "scheme_name": "Ayushman Bharat - PM-JAY",
        "sub_title": "₹5 Lakh annual secondary & tertiary health insurance coverage",
        "issuing_department": "Ministry of Health & Family Welfare",
        "level": "Central",
        "min_age": 0,
        "max_age": 100,
        "income_limit_annual": 250000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "All",
        "occupation_criteria": "All",
        "required_documents": ["Smart Ration Card", "Aadhaar Card", "BPL Certificate"],
        "description": "Health assurance scheme providing cashless hospital coverage of ₹5 Lakh per family per year across empaneled hospitals.",
        "benefits": "Cashless hospitalization coverage up to ₹5,00,000 per family per year.",
        "application_url": "https://pmjay.gov.in"
    },
    {
        "scheme_id": "GOI-AGRI-010",
        "scheme_name": "PM Kisan Samman Nidhi",
        "sub_title": "₹6,000 annual income support for landholding farming families",
        "issuing_department": "Agriculture & Farmers Welfare",
        "level": "Central",
        "min_age": 18,
        "max_age": 85,
        "income_limit_annual": 500000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "All",
        "occupation_criteria": "Farmer",
        "required_documents": ["Land Ownership Document", "Aadhaar Card", "Bank Passbook"],
        "description": "Direct income benefit of ₹6,000 per year released in three equal four-monthly installments of ₹2,000.",
        "benefits": "₹6,000 per year directly credited to farmer bank account.",
        "application_url": "https://pmkisan.gov.in"
    },
    {
        "scheme_id": "TN-AD-011",
        "scheme_name": "Chief Minister's Overseas Scholarship for SC/ST Students",
        "sub_title": "Financial funding for postgraduate masters and PhD programs abroad",
        "issuing_department": "Adi Dravidar and Tribal Welfare (TN)",
        "level": "Tamil Nadu",
        "min_age": 20,
        "max_age": 35,
        "income_limit_annual": 800000.0,
        "gender": "All",
        "social_category": "SC",
        "eligibility_state": "Tamil Nadu",
        "occupation_criteria": "Student",
        "required_documents": ["Community Certificate", "Income Certificate", "Passport", "Undergraduate (UG) Degree", "12th Marksheet"],
        "description": "Financial support covering tuition and living expenses for SC/ST students studying in world-ranked universities.",
        "benefits": "Up to ₹36 Lakh for overseas masters degree tuition and living stipend.",
        "application_url": "https://adw.tn.gov.in"
    },
    {
        "scheme_id": "GOI-DIS-012",
        "scheme_name": "National Scholarship for Students with Disabilities",
        "sub_title": "Higher education scholarship grant for differently-abled scholars",
        "issuing_department": "Ministry of Social Justice & Empowerment",
        "level": "Central",
        "min_age": 16,
        "max_age": 40,
        "income_limit_annual": 300000.0,
        "gender": "All",
        "social_category": "All",
        "eligibility_state": "All",
        "occupation_criteria": "Student",
        "required_documents": ["UDID Card", "Bonafide Certificate", "Income Certificate", "Bank Passbook"],
        "description": "Pre-matric, post-matric, and top-class education scholarships for students with benchmark disabilities.",
        "benefits": "Full fee waiver plus monthly disability assistive maintenance grant.",
        "application_url": "https://scholarships.gov.in"
    }
]

# ---------------------------------------------------------------------------
# DATASET INGESTION & CACHING
# ---------------------------------------------------------------------------

SHEET_ID = "1MTWk1hOKSt3ZEl-mPiQAYZzmpRg3HgLD5BYA3M5VhXI"
SHEET_GID = "1493062875"
CACHED_SCHEMES_LIST: List[Dict[str, Any]] = []

def parse_float_safe(val: Any) -> Optional[float]:
    if val is None:
        return None
    cleaned = re.sub(r"[₹,\s]", "", str(val))
    match = re.search(r"[-+]?\d*\.?\d+", cleaned)
    return float(match.group()) if match else None

def parse_int_safe(val: Any) -> Optional[int]:
    f = parse_float_safe(val)
    return int(f) if f is not None else None

def normalize_text(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower())

def fetch_schemes_dataset() -> List[Dict[str, Any]]:
    global CACHED_SCHEMES_LIST
    if CACHED_SCHEMES_LIST:
        return CACHED_SCHEMES_LIST

    schemes = []
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&gid={SHEET_GID}"
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "UniOra/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            content = response.read().decode("utf-8")
            reader = csv.reader(io.StringIO(content))
            headers = None
            header_map = {}

            for row in reader:
                if not headers:
                    normalized_row = [normalize_text(c) for c in row]
                    if "scheme_name" in normalized_row:
                        headers = row
                        for idx, col_name in enumerate(normalized_row):
                            if col_name:
                                header_map[col_name] = idx
                        continue
                else:
                    get_col = lambda key: row[header_map[key]].strip() if key in header_map and header_map[key] < len(row) else ""
                    name = get_col("scheme_name")
                    if not name:
                        continue

                    docs_str = get_col("required_documents") or get_col("mandatory_documents") or "Aadhaar Card"
                    docs_list = [d.strip() for d in re.split(r"[,;|\n]+", docs_str) if d.strip()]

                    level_val = get_col("eligibility_state") or get_col("level") or "Central"
                    if "tamil nadu" in level_val.lower() or "tn" in level_val.lower():
                        level = "Tamil Nadu"
                    elif "all" in level_val.lower() or "central" in level_val.lower():
                        level = "Central"
                    else:
                        level = level_val.title()

                    schemes.append({
                        "scheme_id": get_col("scheme_id") or f"SCH-{len(schemes)+1:03d}",
                        "scheme_name": name,
                        "sub_title": (get_col("description")[:90] + "...") if len(get_col("description")) > 90 else get_col("description"),
                        "issuing_department": get_col("issuing_department") or "Government Administration",
                        "level": level,
                        "min_age": parse_int_safe(get_col("min_age")),
                        "max_age": parse_int_safe(get_col("max_age")),
                        "income_limit_annual": parse_float_safe(get_col("income_limit_annual")),
                        "gender": get_col("gender") or "All",
                        "social_category": get_col("social_category") or "All",
                        "eligibility_state": get_col("eligibility_state") or level,
                        "occupation_criteria": get_col("occupation_criteria") or "All",
                        "required_documents": docs_list or ["Aadhaar Card"],
                        "description": get_col("description") or name,
                        "benefits": get_col("benefits") or "Welfare assistance and subsidy grant.",
                        "application_url": get_col("application_url") or get_col("official_source_url") or "https://www.india.gov.in"
                    })
    except Exception as err:
        logger.warning(f"Could not load online Google Sheet schemes dataset: {err}. Using embedded dataset.")

    # Merge embedded verified schemes
    existing_names = {normalize_text(s["scheme_name"]) for s in schemes}
    for emb in EMBEDDED_SCHEMES:
        if normalize_text(emb["scheme_name"]) not in existing_names:
            schemes.insert(0, emb)

    CACHED_SCHEMES_LIST = schemes
    return CACHED_SCHEMES_LIST

# ---------------------------------------------------------------------------
# EVALUATION & DOCUMENT READINESS ENGINE
# ---------------------------------------------------------------------------

def is_doc_matched(required_name: str, verified_names: List[str]) -> bool:
    req = normalize_text(required_name)
    for v in verified_names:
        vn = normalize_text(v)
        if req == vn or req in vn or vn in req:
            return True
        if "bonafide" in req and "bonafide" in vn:
            return True
        if "passbook" in req and "passbook" in vn:
            return True
        if "marksheet" in req and ("marksheet" in vn or "degree" in vn or "diploma" in vn):
            return True
        if "income" in req and "income" in vn:
            return True
        if "community" in req and "community" in vn:
            return True
        if ("aadhaar" in req or "identity" in req) and ("aadhaar" in vn or "voter" in vn or "pan" in vn or "passport" in vn):
            return True
        if "ration" in req and "ration" in vn:
            return True
        if "electricity" in req and "electricity" in vn:
            return True
        if ("patta" in req or "land" in req) and "land" in vn:
            return True
        if ("udid" in req or "disability" in req) and "udid" in vn:
            return True
        if "school" in req and ("10th" in vn or "12th" in vn or "bonafide" in vn):
            return True
    return False

def evaluate_scheme(scheme: Dict[str, Any], profile: UserProfileRequest) -> EvaluatedSchemeResponse:
    conditions = []

    # 1. AGE
    min_age = scheme.get("min_age")
    max_age = scheme.get("max_age")
    if min_age is not None or max_age is not None:
        satisfied = True
        reason = ""
        if profile.age is None:
            satisfied = False
            reason = "Age / Date of birth is needed to verify this condition."
        else:
            if min_age is not None and profile.age < min_age:
                satisfied = False
            if max_age is not None and profile.age > max_age:
                satisfied = False
            r_str = f"{min_age}–{max_age}" if (min_age and max_age) else (f"{min_age}+" if min_age else f"up to {max_age}")
            reason = f"Your age ({profile.age}) is within the criteria ({r_str})." if satisfied else f"Age requirement is {r_str}; your age is {profile.age}."
        conditions.append(ConditionDetail(key="age", label="Age requirement", satisfied=satisfied, reason=reason))

    # 2. INCOME
    max_income = scheme.get("income_limit_annual")
    if max_income is not None and max_income > 0:
        satisfied = True
        actual_inc = profile.annual_income
        if actual_inc is None and profile.income_range:
            range_map = {"Below ₹1 Lakh": 90000.0, "₹1 – 2.5 Lakh": 180000.0, "₹2.5 – 5 Lakh": 350000.0, "Above ₹5 Lakh": 600000.0}
            actual_inc = range_map.get(profile.income_range, 150000.0)

        if actual_inc is None:
            satisfied = False
            reason = "Annual family income is needed to verify this condition."
        elif actual_inc <= max_income:
            reason = f"Annual income (₹{actual_inc:,.0f}) is within limit of ₹{max_income:,.0f}."
        else:
            satisfied = False
            reason = f"Annual income (₹{actual_inc:,.0f}) exceeds limit of ₹{max_income:,.0f}."
        conditions.append(ConditionDetail(key="income", label="Income requirement", satisfied=satisfied, reason=reason))

    # 3. GENDER
    gender_req = normalize_text(scheme.get("gender"))
    if gender_req and gender_req not in ["all", "any"]:
        p_gender = normalize_text(profile.gender)
        satisfied = p_gender == gender_req
        reason = f"Your gender ({profile.gender}) meets scheme requirement ({scheme.get('gender')})." if satisfied else f"Requires {scheme.get('gender')}; your profile states {profile.gender or 'Not Specified'}."
        conditions.append(ConditionDetail(key="gender", label="Gender requirement", satisfied=satisfied, reason=reason))

    # 4. STATE / RESIDENCY
    state_req = normalize_text(scheme.get("eligibility_state") or scheme.get("level"))
    if state_req and state_req not in ["all", "central", "any"]:
        p_state = normalize_text(profile.state)
        satisfied = (state_req in p_state or p_state in state_req)
        reason = f"Residency in {profile.state} satisfies location criteria." if satisfied else f"Requires residency in {scheme.get('eligibility_state')}; your profile states {profile.state or 'Not Specified'}."
        conditions.append(ConditionDetail(key="state", label="State residency requirement", satisfied=satisfied, reason=reason))

    # 5. SOCIAL CATEGORY
    cat_req = normalize_text(scheme.get("social_category"))
    if cat_req and cat_req not in ["all", "any", "general/all"]:
        p_cat = normalize_text(profile.social_category)
        satisfied = False
        if p_cat == cat_req or cat_req in p_cat or p_cat in cat_req:
            satisfied = True
        elif cat_req in ["obc", "bc", "mbc"] and p_cat in ["obc", "mbc/dnc", "bc"]:
            satisfied = True
        elif cat_req in ["sc", "st"] and p_cat in ["sc", "st"]:
            satisfied = True
        reason = f"Your category ({profile.social_category}) satisfies reservation criteria." if satisfied else f"Requires {scheme.get('social_category')}; your profile category is {profile.social_category or 'General'}."
        conditions.append(ConditionDetail(key="category", label="Social category requirement", satisfied=satisfied, reason=reason))

    # 6. OCCUPATION
    occ_req = normalize_text(scheme.get("occupation_criteria"))
    if occ_req and occ_req not in ["all", "any"]:
        p_occ = normalize_text(profile.occupation)
        satisfied = (occ_req == p_occ or occ_req in p_occ or p_occ in occ_req)
        reason = f"Your occupation ({profile.occupation}) qualifies." if satisfied else f"Requires occupation: {scheme.get('occupation_criteria')}; your profile: {profile.occupation or 'Not Specified'}."
        conditions.append(ConditionDetail(key="occupation", label="Occupation requirement", satisfied=satisfied, reason=reason))

    # 7. DISABILITY / SPECIAL BENEFICIARY
    scheme_desc_norm = normalize_text(scheme.get("scheme_name")) + " " + normalize_text(scheme.get("description"))
    if "disabilit" in scheme_desc_norm or "udid" in scheme_desc_norm or "differently abled" in scheme_desc_norm:
        satisfied = normalize_text(profile.disability) in ["yes", "true"]
        reason = "Valid disability status recognized." if satisfied else "Scheme is specifically for persons with disabilities (PwD)."
        conditions.append(ConditionDetail(key="disability", label="Disability requirement", satisfied=satisfied, reason=reason))

    if "widow" in scheme_desc_norm:
        satisfied = normalize_text(profile.marital_status) == "widowed" or normalize_text(profile.special) == "destitute widow"
        reason = "Widow beneficiary status recognized." if satisfied else "Scheme is specifically for widows / destitute women."
        conditions.append(ConditionDetail(key="widow", label="Widow status requirement", satisfied=satisfied, reason=reason))

    satisfied_list = [c for c in conditions if c.satisfied]
    failed_list = [c for c in conditions if not c.satisfied]
    is_eligible = len(failed_list) == 0

    # Calculate match score (0-100)
    match_score = 100 if is_eligible else int((len(satisfied_list) / max(len(conditions), 1)) * 100)

    # Document Readiness Calculation
    req_docs = scheme.get("required_documents", ["Aadhaar Card"])
    verified_matched = [d for d in req_docs if is_doc_matched(d, profile.verified_documents)]
    missing_docs = [d for d in req_docs if d not in verified_matched]
    readiness_pct = int((len(verified_matched) / max(len(req_docs), 1)) * 100)

    doc_readiness = DocumentReadiness(
        total_required=len(req_docs),
        verified_count=len(verified_matched),
        missing_count=len(missing_docs),
        readiness_percentage=readiness_pct,
        verified_docs=verified_matched,
        missing_docs=missing_docs
    )

    return EvaluatedSchemeResponse(
        scheme_id=str(scheme.get("scheme_id")),
        scheme_name=scheme.get("scheme_name", ""),
        sub_title=scheme.get("sub_title", ""),
        issuing_department=scheme.get("issuing_department", "Government Administration"),
        level=scheme.get("level", "Central"),
        description=scheme.get("description", ""),
        benefits=scheme.get("benefits"),
        application_url=scheme.get("application_url"),
        required_documents=req_docs,
        eligible=is_eligible,
        evaluated=True,
        match_score=match_score,
        satisfied_conditions=satisfied_list,
        failed_conditions=failed_list,
        document_readiness=doc_readiness
    )

# ---------------------------------------------------------------------------
# API ROUTE ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("", response_model=Dict[str, Any])
def get_schemes(
    q: Optional[str] = Query(None, description="Search term in scheme name, department or description"),
    dept: Optional[str] = Query(None, description="Filter by issuing department"),
    level: Optional[str] = Query(None, description="Filter by Central or Tamil Nadu level"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """Retrieve all welfare schemes with optional search query and department filter."""
    dataset = fetch_schemes_dataset()

    filtered = dataset
    if q:
        query_norm = normalize_text(q)
        filtered = [
            s for s in filtered
            if query_norm in normalize_text(s["scheme_name"])
            or query_norm in normalize_text(s["issuing_department"])
            or query_norm in normalize_text(s["description"])
        ]

    if dept:
        dept_norm = normalize_text(dept)
        filtered = [s for s in filtered if dept_norm == normalize_text(s["issuing_department"])]

    if level:
        lvl_norm = normalize_text(level)
        filtered = [s for s in filtered if lvl_norm == normalize_text(s["level"])]

    total = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_data = filtered[start_idx:end_idx]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "schemes": page_data
    }

@router.get("/departments", response_model=List[str])
def get_departments():
    """Retrieve distinct list of government departments offering welfare schemes."""
    dataset = fetch_schemes_dataset()
    depts = sorted({s["issuing_department"] for s in dataset if s.get("issuing_department")})
    return depts

@router.get("/{scheme_id}")
def get_scheme_by_id(scheme_id: str):
    """Retrieve complete metadata and criteria for a specific welfare scheme."""
    dataset = fetch_schemes_dataset()
    for s in dataset:
        if str(s.get("scheme_id")).lower() == scheme_id.lower():
            return s
    raise HTTPException(status_code=404, detail="Scheme not found")

@router.post("/evaluate", response_model=FullEvaluationResponse)
def evaluate_eligibility(payload: UserProfileRequest):
    """
    Evaluates demographic profile and verified documents against all schemes.
    Returns matched eligible schemes, detailed criteria reasons, and document readiness.
    """
    dataset = fetch_schemes_dataset()

    evaluated_all: List[EvaluatedSchemeResponse] = []
    eligible_only: List[EvaluatedSchemeResponse] = []

    for s in dataset:
        res = evaluate_scheme(s, payload)
        evaluated_all.append(res)
        if res.eligible:
            eligible_only.append(res)

    # Sort eligible schemes by document readiness and match score descending
    eligible_only.sort(key=lambda x: (x.document_readiness.readiness_percentage, x.match_score), reverse=True)

    summary = EvaluationSummary(
        total_schemes=len(dataset),
        eligible_count=len(eligible_only),
        profile_used={
            "age": payload.age,
            "gender": payload.gender,
            "state": payload.state,
            "annual_income": payload.annual_income or payload.income_range,
            "social_category": payload.social_category,
            "occupation": payload.occupation,
            "education": payload.education,
            "disability": payload.disability
        },
        verified_documents_used=payload.verified_documents
    )

    return FullEvaluationResponse(
        summary=summary,
        eligible_schemes=eligible_only,
        all_schemes=evaluated_all
    )
