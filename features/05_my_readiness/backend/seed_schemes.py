"""One-time importer for Feature 04 schemes into Supabase.

Run manually from the repository root with:
    python features/05_my_readiness/backend/seed_schemes.py

The script only upserts records; it never deletes existing schemes.
"""

import hashlib
import os
import re
import sys
from typing import Any

import requests
from dotenv import load_dotenv
from supabase import create_client


API_URL = "http://localhost:8000/api/schemes"
SCHEMES_TABLE = "government_schemes"
PAGE_SIZE = 100
UPSERT_BATCH_SIZE = 100
REQUEST_TIMEOUT_SECONDS = 30

SCHEME_FIELDS = (
    "scheme_name",
    "sub_title",
    "description",
    "benefits",
    "issuing_department",
    "level",
    "min_age",
    "max_age",
    "income_limit_annual",
    "gender",
    "social_category",
    "eligibility_state",
    "occupation_criteria",
    "education_criteria",
    "disability_status",
    "application_url",
)


def _stable_scheme_id(name: str) -> str:
    """Create a repeatable ID for API records missing scheme_id."""
    normalized_name = " ".join(name.split()).casefold()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized_name).strip("-")[:48]
    digest = hashlib.sha256(normalized_name.encode("utf-8")).hexdigest()[:12]
    return f"generated-{slug or 'scheme'}-{digest}"


def _normalize_required_documents(value: Any) -> list[str]:
    """Ensure required_documents is stored as a JSON-compatible string list."""
    if isinstance(value, list):
        return [str(item).strip() for item in value if item and str(item).strip()]
    if isinstance(value, str):
        return [
            item.strip()
            for item in re.split(r"[,;|\n]+", value)
            if item.strip()
        ]
    return []


def _fetch_all_schemes() -> list[dict[str, Any]]:
    """Fetch every API page using the endpoint's page/limit contract."""
    schemes: list[dict[str, Any]] = []
    page = 1
    reported_total: int | None = None
    reported_pages: int | None = None

    while True:
        response = requests.get(
            API_URL,
            params={"page": page, "limit": PAGE_SIZE},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict) or not isinstance(payload.get("schemes"), list):
            raise ValueError("The schemes API response must contain a schemes array.")

        if page == 1:
            total_value = payload.get("total")
            pages_value = payload.get("total_pages")
            reported_total = total_value if isinstance(total_value, int) else None
            reported_pages = pages_value if isinstance(pages_value, int) else None

        page_schemes = payload["schemes"]
        schemes.extend(item for item in page_schemes if isinstance(item, dict))
        print(
            f"Fetched page {page}: {len(page_schemes)} schemes "
            f"({len(schemes)} collected so far)."
        )

        if not page_schemes:
            break
        if reported_total is not None and len(schemes) >= reported_total:
            break
        if reported_pages is not None and page >= reported_pages:
            break
        if len(page_schemes) < PAGE_SIZE:
            break
        page += 1

    print(f"Total schemes fetched from API: {len(schemes)}")
    return schemes


def _to_database_row(scheme: dict[str, Any]) -> dict[str, Any]:
    """Map the API scheme shape to the existing government_schemes columns."""
    name = str(scheme.get("scheme_name") or "").strip()
    if not name:
        raise ValueError("Scheme record is missing scheme_name.")

    scheme_id = str(scheme.get("scheme_id") or "").strip()
    if not scheme_id:
        scheme_id = _stable_scheme_id(name)

    row = {field: scheme.get(field) for field in SCHEME_FIELDS}
    row.update(
        {
            "scheme_id": scheme_id,
            "scheme_name": name,
            "required_documents": _normalize_required_documents(
                scheme.get("required_documents")
            ),
            "is_active": True,
        }
    )
    return row


def _unique_database_rows(schemes: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Prepare rows and collapse duplicate IDs before sending each upsert batch."""
    rows_by_id: dict[str, dict[str, Any]] = {}
    skipped = 0
    for index, scheme in enumerate(schemes, start=1):
        try:
            row = _to_database_row(scheme)
        except (TypeError, ValueError) as error:
            skipped += 1
            print(f"Skipping scheme {index}: {error}")
            continue
        rows_by_id[row["scheme_id"]] = row

    duplicate_count = len(schemes) - skipped - len(rows_by_id)
    if duplicate_count:
        print(f"Collapsed {duplicate_count} duplicate scheme IDs before upsert.")
    return list(rows_by_id.values()), skipped


def _upsert_schemes(client: Any, rows: list[dict[str, Any]]) -> tuple[int, int]:
    """Upsert rows in bounded batches using scheme_id as the conflict key."""
    completed = 0
    failed = 0

    for start in range(0, len(rows), UPSERT_BATCH_SIZE):
        batch = rows[start : start + UPSERT_BATCH_SIZE]
        batch_number = start // UPSERT_BATCH_SIZE + 1
        try:
            client.table(SCHEMES_TABLE).upsert(
                batch,
                on_conflict="scheme_id",
            ).execute()
            completed += len(batch)
            print(
                f"Upserted batch {batch_number}: {len(batch)} schemes "
                f"({completed} inserted/updated so far)."
            )
        except Exception as error:
            failed += len(batch)
            print(f"Error upserting batch {batch_number}: {error}", file=sys.stderr)

    return completed, failed


def main() -> int:
    """Fetch and upsert the catalogue when invoked as a manual migration."""
    load_dotenv()
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print(
            "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment or .env.",
            file=sys.stderr,
        )
        return 1

    try:
        schemes = _fetch_all_schemes()
    except (requests.RequestException, ValueError) as error:
        print(f"Error fetching schemes from {API_URL}: {error}", file=sys.stderr)
        return 1

    if not schemes:
        print("Error: the schemes API returned no scheme records.", file=sys.stderr)
        return 1

    rows, skipped = _unique_database_rows(schemes)
    if not rows:
        print("Error: no valid scheme records were available to upsert.", file=sys.stderr)
        return 1

    try:
        client = create_client(supabase_url, supabase_key)
    except Exception as error:
        print(f"Error initializing Supabase client: {error}", file=sys.stderr)
        return 1

    completed, failed = _upsert_schemes(client, rows)
    print(
        "Migration summary: "
        f"fetched={len(schemes)}, prepared={len(rows)}, "
        f"inserted/updated={completed}, skipped={skipped}, failed={failed}."
    )
    return 1 if failed or skipped else 0


if __name__ == "__main__":
    raise SystemExit(main())