"""FastAPI routes for Feature 05: My Readiness.

Mount ``router`` under ``/api`` to expose these endpoints below
``/api/readiness``. Scheme records are read from the separately provisioned
``government_schemes`` table; this module never creates database tables.
"""

from datetime import date, datetime
import logging
import os
import re
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from supabase import create_client


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/readiness", tags=["My Readiness"])

PLACEHOLDER_URL = "https://your-project-id.supabase.co"
PLACEHOLDER_KEY = "your-anon-key"


class SchemeModel(BaseModel):
    """Public scheme fields returned by the government_schemes table."""

    id: str | None = None
    scheme_id: str | None = None
    scheme_name: str
    issuing_department: str | None = None
    level: str | None = None
    sub_title: str | None = None
    description: str | None = None
    benefits: str | None = None
    application_url: str | None = None
    min_age: int | None = None
    max_age: int | None = None
    gender: str | None = None
    eligibility_state: str | None = None
    income_limit_annual: float | None = None
    social_category: str | None = None
    occupation_criteria: str | None = None
    education_criteria: str | None = None
    required_documents: list[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SchemeListResponse(BaseModel):
    schemes: list[SchemeModel]
    count: int


class SchemeReadinessModel(BaseModel):
    scheme_id: str
    scheme_name: str
    readiness_score: int
    is_demographic_eligible: bool
    is_ready: bool
    required_fields: list[str]
    missing_fields: list[str]
    required_documents: list[str]
    missing_documents: list[str]


class EvaluationResponse(BaseModel):
    uid: str
    count: int
    results: list[SchemeReadinessModel]


class ReadinessSaveRequest(BaseModel):
    selected_scheme_id: str = Field(min_length=1)
    readiness_score: int = Field(ge=0, le=100)
    eligible_schemes_count: int = Field(ge=0)
    readiness_data: dict[str, Any] = Field(default_factory=dict)


class SavedReadinessResponse(BaseModel):
    readiness: dict[str, Any] | None


class ReadinessSaveResponse(BaseModel):
    readiness: dict[str, Any]


def _ensure_supabase_configured() -> tuple[str, str]:
    """Read current environment credentials and reject missing placeholders."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if (
        not supabase_url
        or not supabase_key
        or supabase_url == PLACEHOLDER_URL
        or supabase_key == PLACEHOLDER_KEY
    ):
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY.",
        )
    return supabase_url, supabase_key


def _create_supabase_client() -> Any:
    """Create a client using the current process environment configuration."""
    supabase_url, supabase_key = _ensure_supabase_configured()
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as exc:
        logger.error("Feature 05 Supabase client initialization failed")
        raise HTTPException(
            status_code=503,
            detail="Supabase client could not be initialized.",
        ) from exc


def _execute(query: Any) -> Any:
    """Execute a Supabase query and return its data with a clean API error."""
    try:
        response = query.execute()
        return response.data
    except Exception as exc:
        logger.exception("Feature 05 Supabase query failed")
        raise HTTPException(
            status_code=502,
            detail="The database request could not be completed.",
        ) from exc


def _authenticated_database(
    authorization: str | None = Header(default=None),
) -> tuple[str, Any]:
    """Validate the caller's Supabase token and create an RLS-scoped client."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="A bearer access token is required.")

    access_token = authorization.split(" ", 1)[1].strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="A bearer access token is required.")

    try:
        auth_client = _create_supabase_client()
        auth_response = auth_client.auth.get_user(access_token)
        user = getattr(auth_response, "user", None)
        uid = getattr(user, "id", None)
        if not uid:
            raise HTTPException(status_code=401, detail="The access token is invalid.")

        # Use a per-request client so one user's JWT cannot leak into another request.
        user_client = _create_supabase_client()
        user_client.postgrest.auth(access_token)
        return str(uid), user_client
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Feature 05 Supabase authentication failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail="The access token could not be validated.",
        ) from exc


def _normalize_documents(value: Any) -> list[str]:
    """Normalize the table's document field to a JSON string array."""
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if isinstance(value, str) and value.strip():
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _scheme_row(row: dict[str, Any]) -> SchemeModel:
    """Validate and normalize a database row before returning it to clients."""
    normalized = dict(row)
    normalized["required_documents"] = _normalize_documents(
        normalized.get("required_documents")
    )
    return SchemeModel.model_validate(normalized)


def _get_scheme_rows(client: Any, limit: int = 500) -> list[dict[str, Any]]:
    """Return active schemes for server-side readiness evaluation."""
    rows = _execute(
        client.table("government_schemes")
        .select("*")
        .eq("is_active", True)
        .order("scheme_name")
        .limit(limit)
    )
    return rows or []


def _find_scheme(client: Any, scheme_id: str) -> dict[str, Any] | None:
    """Look up a scheme by its public scheme_id, then by database id."""
    row = _execute(
        client.table("government_schemes")
        .select("*")
        .eq("is_active", True)
        .eq("scheme_id", scheme_id)
        .maybe_single()
    )
    if row:
        return row

    return _execute(
        client.table("government_schemes")
        .select("*")
        .eq("is_active", True)
        .eq("id", scheme_id)
        .maybe_single()
    )


def _age_from_profile(profile: dict[str, Any]) -> int | None:
    """Use a stored age when present, otherwise derive it from date_of_birth."""
    if profile.get("age") not in (None, ""):
        try:
            return int(profile["age"])
        except (TypeError, ValueError):
            return None

    dob_value = profile.get("date_of_birth")
    if not dob_value:
        return None
    try:
        dob = date.fromisoformat(str(dob_value)[:10])
    except ValueError:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _income_value(value: Any) -> float | None:
    """Convert common currency-formatted income values to a number."""
    if value in (None, ""):
        return None
    cleaned = re.sub(r"[^0-9.\-]", "", str(value))
    try:
        return float(cleaned)
    except ValueError:
        return None


def _matches_rule(user_value: Any, rule_value: Any) -> bool:
    """Compare textual profile criteria while allowing descriptive values."""
    if user_value in (None, "") or rule_value in (None, ""):
        return True
    rule = str(rule_value).strip().casefold()
    user = str(user_value).strip().casefold()
    return rule == "all" or rule == user or rule in user or user in rule


def _document_is_verified(required_name: str, documents: list[dict[str, Any]]) -> bool:
    """Match a required document against this user's verified document records."""
    required = required_name.casefold().strip()
    for document in documents:
        if document.get("is_verified") is not True:
            continue
        actual = str(document.get("document_type") or "").casefold().strip()
        if actual and (required == actual or required in actual or actual in required):
            return True
    return False


def _evaluate_scheme(
    scheme_row: dict[str, Any],
    profile: dict[str, Any],
    documents: list[dict[str, Any]],
) -> SchemeReadinessModel:
    """Evaluate profile criteria and verified documents for one scheme."""
    scheme = _scheme_row(scheme_row)
    scheme_data = scheme.model_dump()
    required_fields: list[str] = []
    rules = {
        "age": scheme_data.get("min_age") is not None or scheme_data.get("max_age") is not None,
        "gender": scheme_data.get("gender") not in (None, "", "All"),
        "state": scheme_data.get("eligibility_state") not in (None, "", "All"),
        "annual_income": scheme_data.get("income_limit_annual") is not None,
        "social_category": scheme_data.get("social_category") not in (None, "", "All"),
        "occupation": scheme_data.get("occupation_criteria") not in (None, "", "All"),
        "education": scheme_data.get("education_criteria") not in (None, "", "All"),
    }
    required_fields.extend(field for field, required in rules.items() if required)

    profile_values = {
        "age": _age_from_profile(profile),
        "gender": profile.get("gender"),
        "state": profile.get("state"),
        "annual_income": profile.get("annual_family_income"),
        "social_category": profile.get("social_category"),
        "occupation": profile.get("occupation"),
        "education": profile.get("education_level"),
    }
    missing_fields = [
        field for field in required_fields if profile_values.get(field) in (None, "")
    ]

    age = profile_values["age"]
    income = _income_value(profile_values["annual_income"])
    demographic_match = True
    if age is not None:
        if scheme.min_age is not None and age < scheme.min_age:
            demographic_match = False
        if scheme.max_age is not None and age > scheme.max_age:
            demographic_match = False
    if not _matches_rule(profile_values["gender"], scheme.gender):
        demographic_match = False
    if not _matches_rule(profile_values["state"], scheme.eligibility_state):
        demographic_match = False
    if income is not None and scheme.income_limit_annual is not None:
        if income > scheme.income_limit_annual:
            demographic_match = False
    if not _matches_rule(profile_values["social_category"], scheme.social_category):
        demographic_match = False
    if not _matches_rule(profile_values["occupation"], scheme.occupation_criteria):
        demographic_match = False
    if not _matches_rule(profile_values["education"], scheme.education_criteria):
        demographic_match = False

    required_documents = scheme.required_documents
    missing_documents = [
        required
        for required in required_documents
        if not _document_is_verified(required, documents)
    ]
    total_items = len(required_fields) + len(required_documents)
    completed_items = total_items - len(missing_fields) - len(missing_documents)
    score = round(completed_items * 100 / total_items) if total_items else 0

    return SchemeReadinessModel(
        scheme_id=scheme.scheme_id or scheme.id or "",
        scheme_name=scheme.scheme_name,
        readiness_score=score,
        is_demographic_eligible=demographic_match,
        is_ready=not missing_fields and not missing_documents and demographic_match,
        required_fields=required_fields,
        missing_fields=missing_fields,
        required_documents=required_documents,
        missing_documents=missing_documents,
    )


@router.get("/schemes", response_model=SchemeListResponse)
def get_schemes(limit: int = Query(default=100, ge=1, le=500)) -> SchemeListResponse:
    """Get active government schemes from the existing schemes table."""
    client = _create_supabase_client()
    rows = _get_scheme_rows(client, limit=limit)
    schemes = [_scheme_row(row) for row in rows]
    return SchemeListResponse(schemes=schemes, count=len(schemes))


@router.get("/schemes/{scheme_id}", response_model=SchemeModel)
def get_scheme(scheme_id: str) -> SchemeModel:
    """Get one active government scheme by scheme_id or database id."""
    client = _create_supabase_client()
    row = _find_scheme(client, scheme_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return _scheme_row(row)


@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_readiness(
    scheme_id: str | None = None,
    identity: tuple[str, Any] = Depends(_authenticated_database),
) -> EvaluationResponse:
    """Evaluate the signed-in user's profile and verified documents."""
    uid, user_client = identity
    profile = _execute(
        user_client.table("user_info")
        .select("*")
        .eq("uid", uid)
        .maybe_single()
    ) or {}
    documents = _execute(
        user_client.table("user_documents")
        .select("document_type,is_verified")
        .eq("uid", uid)
    ) or []

    scheme_client = _create_supabase_client()
    if scheme_id:
        row = _find_scheme(scheme_client, scheme_id)
        if not row:
            raise HTTPException(status_code=404, detail="Scheme not found.")
        rows = [row]
    else:
        rows = _get_scheme_rows(scheme_client)

    results = [_evaluate_scheme(row, profile, documents) for row in rows]
    return EvaluationResponse(uid=uid, count=len(results), results=results)


@router.get("/saved", response_model=SavedReadinessResponse)
def get_saved_readiness(
    identity: tuple[str, Any] = Depends(_authenticated_database),
) -> SavedReadinessResponse:
    """Get the signed-in user's saved readiness row, if one exists."""
    uid, user_client = identity
    rows = _execute(
        user_client.table("user_readiness")
        .select("*")
        .eq("uid", uid)
        .limit(1)
    )
    row = rows[0] if rows else None
    return SavedReadinessResponse(readiness=row)


@router.put("/saved", response_model=ReadinessSaveResponse)
def save_readiness(
    payload: ReadinessSaveRequest,
    identity: tuple[str, Any] = Depends(_authenticated_database),
) -> ReadinessSaveResponse:
    """Upsert readiness for the authenticated user without accepting a client uid."""
    uid, user_client = identity
    rows = _execute(
        user_client.table("user_readiness")
        .upsert(
            {
                "uid": uid,
                "selected_scheme_id": payload.selected_scheme_id,
                "readiness_score": payload.readiness_score,
                "eligible_schemes_count": payload.eligible_schemes_count,
                "readiness_data": payload.readiness_data,
                "updated_at": datetime.now().astimezone().isoformat(),
            },
            on_conflict="uid",
        )
        .select("*")
    )
    row = rows[0] if rows else None
    if not row:
        raise HTTPException(status_code=502, detail="The readiness record was not saved.")
    return ReadinessSaveResponse(readiness=row)