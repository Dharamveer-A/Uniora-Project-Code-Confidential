/* ==================================================================
   UNIORA — Explore Welfare Schemes
   Feature 01: Scheme Recommendation — Frontend Logic
   ==================================================================
   Google Sheet -> FastAPI -> Pandas -> common/js/api.js -> script.js -> UI
   ================================================================== */

import { supabase } from '../../../common/js/supabase.js';
import * as authApi from '../../../common/js/auth.js';
import { initNavbarAuth } from '../../../common/js/navbar.js';

let schemesApi = null;
let commonUtils = null;

try {
  schemesApi = await import('../../../common/js/api.js');
} catch (err) {
  console.warn('[UNIORA] common/js/api.js not available yet:', err);
}

try {
  commonUtils = await import('../../../common/js/common.js');
} catch (err) {
  // Optional module
}

/* ------------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------------- */
const ITEMS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const DESCRIPTION_WORD_LIMIT = 10;

/* ------------------------------------------------------------------
   TEMPORARY DATA SOURCE — direct public Google Sheet fallback.
------------------------------------------------------------------- */
const SHEET_ID = '1MTWk1hOKSt3ZEl-mPiQAYZzmpRg3HgLD5BYA3M5VhXI';
const SHEET_TAB_GIDS = ['1493062875'];
let cachedSheetSchemes = null;

async function fetchSchemesFromGoogleSheet() {
  if (cachedSheetSchemes) return cachedSheetSchemes;

  const allRows = [];
  for (const gid of SHEET_TAB_GIDS) {
    const gidParam = gid ? `&gid=${encodeURIComponent(gid)}` : '';
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv${gidParam}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheet fetch failed (gid ${gid}): HTTP ${response.status}`);
    }
    const csvText = await response.text();
    allRows.push(...parseCSV(csvText));
  }

  cachedSheetSchemes = schemesFromCsvRows(allRows);
  return cachedSheetSchemes;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // ignore
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function isHeaderRow(cells) {
  const normalized = cells.map((c) => String(c || '').trim().toLowerCase());
  return normalized.includes('scheme_name') && normalized.includes('description');
}

function schemesFromCsvRows(rows) {
  let headerMap = null;
  const schemes = [];

  for (const cells of rows) {
    if (isHeaderRow(cells)) {
      headerMap = {};
      cells.forEach((cell, idx) => {
        const key = String(cell || '').trim().toLowerCase();
        if (key) headerMap[key] = idx;
      });
      continue;
    }

    if (!headerMap) continue;

    const get = (field) => {
      const idx = headerMap[field];
      if (idx === undefined) return '';
      return (cells[idx] || '').trim();
    };

    const schemeId = get('scheme_id');
    const schemeName = get('scheme_name');
    if (!schemeId || !schemeName) continue;

    const description = get('description');
    const benefits = get('benefits');

    schemes.push({
      scheme_id: schemeId,
      scheme_name: schemeName,
      category_type: get('category_type') || null,
      sector_category: get('sector_category') || null,
      sub_sector: get('sub_sector') || null,
      issuing_department: get('issuing_department') || null,
      min_age: toNumberOrNull(get('min_age')),
      max_age: toNumberOrNull(get('max_age')),
      income_limit_annual: toNumberOrNull(get('income_limit_annual')),
      is_estimate: /yes|true/i.test(get('is_estimate')),
      gender: get('gender') || null,
      gender_notes: get('gender_notes') || null,
      social_category: get('social_category') || null,
      occupation_criteria: get('occupation_criteria') || null,
      residency_requirement: get('residency_requirement') || null,
      eligibility_state: get('eligibility_state') || null,
      other_conditions: get('other_conditions') || null,
      description: description || null,
      benefits: benefits || null,
      application_mode: get('application_mode') || null,
      application_process: get('application_process') || null,
      application_url: get('application_url') || null,
      required_documents: get('required_documents') || get('mandatory_documents') || null,
      mandatory_documents: get('mandatory_documents') || null,
      official_source_url: get('official_source_url') || null,
      source_platform: get('source_platform') || null,
      last_verified_date: get('last_verified_date') || null,
      scheme_status: get('scheme_status') || null,
    });
  }

  return schemes;
}

function toNumberOrNull(value) {
  if (!value) return null;
  const num = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isNaN(num) ? null : num;
}

const SEARCH_FIELDS = [
  'scheme_name', 'description', 'benefits', 'category_type',
  'sector_category', 'sub_sector', 'issuing_department',
];

/* ------------------------------------------------------------------
   STATE
------------------------------------------------------------------- */
const state = {
  currentUser: null,

  allSchemes: [],
  filteredSchemes: [],
  serverPaginated: false,
  serverTotal: 0,

  currentPage: 1,
  totalPages: 1,

  search: '',
  filters: { category: 'all', sector: 'all', gender: 'all', status: 'all' },

  isLoading: true,
};

/* ------------------------------------------------------------------
   DOM REFERENCES
------------------------------------------------------------------- */
const dom = {
  searchInput: document.getElementById('schemeSearchInput'),

  filterCategory: document.getElementById('filterCategory'),
  filterSector: document.getElementById('filterSector'),
  filterGender: document.getElementById('filterGender'),
  filterStatus: document.getElementById('filterStatus'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),

  resultsCount: document.getElementById('resultsCount'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  emptyState: document.getElementById('emptyState'),
  schemeGrid: document.getElementById('schemeGrid'),
  retryBtn: document.getElementById('retryBtn'),
  emptyResetBtn: document.getElementById('emptyResetBtn'),

  pagination: document.getElementById('pagination'),
  paginationPrev: document.getElementById('paginationPrev'),
  paginationNext: document.getElementById('paginationNext'),
  paginationList: document.getElementById('paginationList'),

  modalOverlay: document.getElementById('schemeModalOverlay'),
  modal: document.getElementById('schemeModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalTags: document.getElementById('modalTags'),
  modalTitle: document.getElementById('modalSchemeName'),
  modalMeta: document.getElementById('modalMeta'),
  modalBody: document.getElementById('modalBody'),
  modalFooter: document.getElementById('modalFooter'),
};

let lastFocusedElement = null;

/* ------------------------------------------------------------------
   UTILITIES
------------------------------------------------------------------- */
function localDebounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debounce = (commonUtils && commonUtils.debounce) ? commonUtils.debounce : localDebounce;

function hasValue(value) {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (str === '') return false;
  return !/^(n\/?a|null|undefined|none)$/i.test(str);
}

function formatCurrency(value) {
  if (!hasValue(value)) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return '₹' + num.toLocaleString('en-IN');
}

function formatDate(value) {
  if (!hasValue(value)) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusModifier(status) {
  if (!hasValue(status)) return '';
  const val = String(status).toLowerCase();
  if (val.includes('active')) return 'active';
  if (val.includes('upcoming')) return 'upcoming';
  if (val.includes('closed') || val.includes('ended') || val.includes('discontinued') || val.includes('subsumed')) return 'closed';
  return '';
}

function statusBadgeLabel(status) {
  if (!hasValue(status)) return null;
  const val = String(status).toLowerCase();
  if (val.includes('active')) return 'Active';
  if (val.includes('upcoming')) return 'Upcoming';
  if (val.includes('closed') || val.includes('ended') || val.includes('discontinued') || val.includes('subsumed')) return 'Closed';
  return String(status);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(hasValue).map((v) => String(v).trim())))
    .sort((a, b) => a.localeCompare(b));
}

function truncateWords(text, limit) {
  const words = String(text).trim().split(/\s+/);
  if (words.length <= limit) return { text: String(text).trim(), truncated: false };
  return { text: words.slice(0, limit).join(' '), truncated: true };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------
   DATA LOADING
------------------------------------------------------------------- */
async function loadSchemes({ resetPage = false } = {}) {
  if (resetPage) state.currentPage = 1;
  setLoadingState();

  const hasBackend = !!schemesApi && typeof schemesApi.fetchSchemes === 'function';

  try {
    if (hasBackend) {
      const response = await schemesApi.fetchSchemes({
        page: state.currentPage,
        pageSize: ITEMS_PER_PAGE,
        search: state.search,
        filters: state.filters,
      });

      const schemes = Array.isArray(response?.schemes) ? response.schemes : [];
      state.serverPaginated = !!response?.serverPaginated;

      if (state.serverPaginated) {
        state.filteredSchemes = schemes;
        state.serverTotal = Number(response?.total ?? schemes.length);
        state.totalPages = Math.max(1, Math.ceil(state.serverTotal / ITEMS_PER_PAGE));
        populateDynamicFilterOptions(response?.filterOptions);
        renderResults();
        return;
      }

      if (state.allSchemes.length === 0) state.allSchemes = schemes;
      populateDynamicFilterOptions(response?.filterOptions);
      applyFiltersAndSearch();
      return;
    }

    state.serverPaginated = false;
    if (state.allSchemes.length === 0) {
      state.allSchemes = await fetchSchemesFromGoogleSheet();
    }
    populateDynamicFilterOptions();
    applyFiltersAndSearch();
  } catch (err) {
    console.error('[UNIORA] Failed to load schemes:', err);
    setErrorState();
  }
}

function populateDynamicFilterOptions(filterOptions) {
  const source = filterOptions || deriveFilterOptionsFromDataset(state.allSchemes);
  fillSelect(dom.filterCategory, source.category_type);
  fillSelect(dom.filterSector, source.sector_category);
  fillSelect(dom.filterGender, source.gender);
  fillSelect(dom.filterStatus, source.scheme_status);
}

function deriveFilterOptionsFromDataset(schemes) {
  return {
    category_type: uniqueSorted(schemes.map((s) => s.category_type)),
    sector_category: uniqueSorted(schemes.map((s) => s.sector_category)),
    gender: uniqueSorted(schemes.map((s) => s.gender)),
    scheme_status: uniqueSorted(schemes.map((s) => statusBadgeLabel(s.scheme_status))),
  };
}

function fillSelect(selectEl, values) {
  if (!selectEl || !values) return;
  const current = selectEl.value;
  const options = ['<option value="all">All</option>']
    .concat(values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`));
  selectEl.innerHTML = options.join('');
  if (values.includes(current)) selectEl.value = current;
}

/* ------------------------------------------------------------------
   FILTER / SEARCH
------------------------------------------------------------------- */
function applyFiltersAndSearch() {
  if (state.serverPaginated) {
    loadSchemes();
    return;
  }

  const q = state.search.trim().toLowerCase();
  const f = state.filters;

  const result = state.allSchemes.filter((scheme) => {
    if (q) {
      const haystack = SEARCH_FIELDS.map((field) => String(scheme[field] || '').toLowerCase()).join(' ');
      if (!haystack.includes(q)) return false;
    }
    if (f.category !== 'all' && scheme.category_type !== f.category) return false;
    if (f.sector !== 'all' && scheme.sector_category !== f.sector) return false;
    if (f.gender !== 'all' && scheme.gender !== f.gender) return false;
    if (f.status !== 'all' && statusBadgeLabel(scheme.scheme_status) !== f.status) return false;
    return true;
  });

  state.filteredSchemes = result;
  state.totalPages = Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE));
  state.currentPage = Math.min(state.currentPage, state.totalPages);

  renderResults();
}

/* ------------------------------------------------------------------
   RENDERING — STATES
------------------------------------------------------------------- */
function setLoadingState() {
  state.isLoading = true;
  if (dom.loadingState) dom.loadingState.hidden = false;
  if (dom.errorState) dom.errorState.hidden = true;
  if (dom.emptyState) dom.emptyState.hidden = true;
  if (dom.schemeGrid) dom.schemeGrid.hidden = true;
  if (dom.pagination) dom.pagination.hidden = true;
  if (dom.resultsCount) dom.resultsCount.textContent = 'Loading…';
}

function setErrorState() {
  state.isLoading = false;
  if (dom.loadingState) dom.loadingState.hidden = true;
  if (dom.errorState) dom.errorState.hidden = false;
  if (dom.emptyState) dom.emptyState.hidden = true;
  if (dom.schemeGrid) dom.schemeGrid.hidden = true;
  if (dom.pagination) dom.pagination.hidden = true;
  if (dom.resultsCount) dom.resultsCount.textContent = '';
}

function renderResults() {
  state.isLoading = false;
  if (dom.loadingState) dom.loadingState.hidden = true;
  if (dom.errorState) dom.errorState.hidden = true;

  const total = state.serverPaginated ? state.serverTotal : state.filteredSchemes.length;

  if (total === 0) {
    if (dom.emptyState) dom.emptyState.hidden = false;
    if (dom.schemeGrid) dom.schemeGrid.hidden = true;
    if (dom.pagination) dom.pagination.hidden = true;
    if (dom.resultsCount) dom.resultsCount.textContent = '0 schemes found';
    return;
  }

  if (dom.emptyState) dom.emptyState.hidden = true;
  if (dom.schemeGrid) dom.schemeGrid.hidden = false;
  if (dom.resultsCount) dom.resultsCount.textContent = `${total} scheme${total === 1 ? '' : 's'} found`;

  const pageItems = state.serverPaginated
    ? state.filteredSchemes
    : paginate(state.filteredSchemes, state.currentPage, ITEMS_PER_PAGE);

  renderSchemeGrid(pageItems);
  renderPagination(total);
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/* ------------------------------------------------------------------
   RENDERING — SCHEME CARDS
------------------------------------------------------------------- */
const SCHEME_ICONS = [
  {
    match: /water|sanitation|drinking|jal/i,
    bg: '#eff6ff', color: '#2563eb',
    path: '<path d="M12 2.7s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.1 12 2.7 12 2.7z"/>',
  },
  {
    match: /health|medical|hospital|insurance|ayushman/i,
    bg: '#fef2f2', color: '#e11d48',
    path: '<path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.1 8.1a1 1 0 0 0 1.4 0l8.1-8.1a5 5 0 0 0 0-7.1z"/>',
  },
  {
    match: /education|school|scholarship|student|skill|training/i,
    bg: '#f5f3ff', color: '#7c3aed',
    path: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M6 10.5V17c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-6.5"/>',
  },
  {
    match: /agricultur|farmer|kisan|crop|rural|irrigat/i,
    bg: '#f0fdf4', color: '#16a34a',
    path: '<path d="M12 21c0-6 3-11 9-12-1 6-4 9-9 12z"/><path d="M12 21C12 15 9 10 3 9c1 6 4 9 9 12z"/>',
  },
  {
    match: /housing|shelter|awas|home|urban/i,
    bg: '#fff7ed', color: '#ea580c',
    path: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8"/>',
  },
  {
    match: /employ|job|labour|worker|pension|business|enterprise|msme|financ|loan|bank/i,
    bg: '#ecfeff', color: '#0891b2',
    path: '<path d="M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  },
  {
    match: /women|child|girl|maternity|family|social|welfare|senior|disab/i,
    bg: '#fdf2f8', color: '#db2777',
    path: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.8"/><path d="M18.5 20a5.6 5.6 0 0 0-2.3-4.5"/>',
  },
];

const FALLBACK_ICON = {
  bg: '#f1f5f9', color: '#475569',
  path: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/><line x1="15" y1="13" x2="9" y2="13"/><line x1="15" y1="17" x2="9" y2="17"/>',
};

function pickSchemeIcon(scheme) {
  const haystack = [scheme.sector_category, scheme.sub_sector, scheme.category_type, scheme.scheme_name]
    .filter(Boolean).join(' ');
  return SCHEME_ICONS.find((icon) => icon.match.test(haystack)) || FALLBACK_ICON;
}

const META_ICONS = {
  category: '<path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4l2 2h5A1.5 1.5 0 0 1 17 7.5v7A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5z"/>',
  sector: '<circle cx="10" cy="10" r="7"/><path d="M10 3v14M3 10h14"/>',
  mode: '<path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M7 17h6"/>',
  age: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 2"/>',
};

function metaItem(iconKey, label, value) {
  return `
    <div class="scheme-card__meta-item">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor"
           stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${META_ICONS[iconKey] || META_ICONS.category}
      </svg>
      <span class="scheme-card__meta-item-text">
        <span class="scheme-card__meta-item-label">${escapeHtml(label)}</span>
        <span class="scheme-card__meta-item-value" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
      </span>
    </div>`;
}

function renderSchemeGrid(schemes) {
  if (!dom.schemeGrid) return;
  dom.schemeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  schemes.forEach((scheme) => fragment.appendChild(buildSchemeCard(scheme)));
  dom.schemeGrid.appendChild(fragment);
}

function buildSchemeCard(scheme) {
  const card = document.createElement('article');
  card.className = 'scheme-card';

  const icon = pickSchemeIcon(scheme);
  card.style.setProperty('--icon-bg', icon.bg);
  card.style.setProperty('--icon-color', icon.color);

  const statusMod = statusModifier(scheme.scheme_status);
  const statusLabel = statusBadgeLabel(scheme.scheme_status);
  const badges = [];
  if (statusLabel) {
    badges.push(`<span class="scheme-card__badge${statusMod ? ` scheme-card__badge--${statusMod}` : ''}">${escapeHtml(statusLabel)}</span>`);
  }
  if (hasValue(scheme.category_type)) {
    badges.push(`<span class="scheme-card__category">${escapeHtml(scheme.category_type)}</span>`);
  }

  const metas = [];
  if (hasValue(scheme.category_type)) metas.push(metaItem('category', 'Category', scheme.category_type));
  if (hasValue(scheme.sector_category)) metas.push(metaItem('sector', 'Sector', scheme.sector_category));
  if (hasValue(scheme.application_mode)) metas.push(metaItem('mode', 'Application Mode', scheme.application_mode));
  if (metas.length < 3 && hasValue(scheme.min_age)) metas.push(metaItem('age', 'Min Age', `${scheme.min_age} yrs`));

  let descriptionHtml = '';
  if (hasValue(scheme.description)) {
    const { text, truncated } = truncateWords(scheme.description, DESCRIPTION_WORD_LIMIT);
    descriptionHtml = `<p class="scheme-card__description">${escapeHtml(text)}${truncated ? '… ' : ' '}<button type="button" class="scheme-card__more">Read more</button></p>`;
  }

  const benefitText = hasValue(scheme.benefits) ? scheme.benefits : null;
  const benefitHtml = benefitText
    ? `<div class="scheme-card__benefit">
         <span class="scheme-card__benefit-label">
           <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <rect x="2.5" y="8" width="15" height="9" rx="1.5"/>
             <path d="M2.5 8h15M10 8v9M10 8S8 4 6 4a2 2 0 1 0 0 4M10 8s2-4 4-4a2 2 0 1 1 0 4"/>
           </svg>
           Key benefit
         </span>
         <p class="scheme-card__benefit-text">${escapeHtml(benefitText)}</p>
       </div>`
    : '';

  card.innerHTML = `
    <div class="scheme-card__icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon.path}</svg>
    </div>

    <div class="scheme-card__main">
      ${badges.length ? `<div class="scheme-card__top">${badges.join('')}</div>` : ''}
      <h3 class="scheme-card__name">${escapeHtml(scheme.scheme_name || 'Untitled scheme')}</h3>
      ${hasValue(scheme.issuing_department) ? `<p class="scheme-card__dept" title="${escapeHtml(scheme.issuing_department)}">${escapeHtml(scheme.issuing_department)}</p>` : ''}
      ${descriptionHtml}
      ${metas.length ? `<div class="scheme-card__meta-icons">${metas.join('')}</div>` : ''}
    </div>

    <div class="scheme-card__side">
      ${benefitHtml}
      <button type="button" class="btn btn--primary scheme-card__cta">View details</button>
    </div>
  `;

  card.querySelectorAll('.scheme-card__cta, .scheme-card__more').forEach((btn) => {
    btn.addEventListener('click', () => openModal(scheme));
  });

  return card;
}

/* ------------------------------------------------------------------
   RENDERING — PAGINATION
------------------------------------------------------------------- */
function renderPagination(total) {
  if (!dom.pagination) return;
  const totalPages = state.serverPaginated ? state.totalPages : Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (totalPages <= 1) {
    dom.pagination.hidden = true;
    return;
  }

  dom.pagination.hidden = false;
  if (dom.paginationPrev) dom.paginationPrev.disabled = state.currentPage <= 1;
  if (dom.paginationNext) dom.paginationNext.disabled = state.currentPage >= totalPages;

  if (dom.paginationList) {
    dom.paginationList.innerHTML = '';
    buildPageNumbers(state.currentPage, totalPages).forEach((entry) => {
      const li = document.createElement('li');
      if (entry === '…') {
        li.className = 'pagination__ellipsis';
        li.textContent = '…';
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pagination__page' + (entry === state.currentPage ? ' pagination__page--active' : '');
        btn.textContent = String(entry);
        btn.setAttribute('aria-label', `Page ${entry}`);
        if (entry === state.currentPage) btn.setAttribute('aria-current', 'page');
        btn.addEventListener('click', () => goToPage(entry));
        li.appendChild(btn);
      }
      dom.paginationList.appendChild(li);
    });
  }
}

function buildPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  const pages = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  pages.push(1);
  if (range[0] > 2) pages.push('…');
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push('…');
  if (total > 1) pages.push(total);

  return pages;
}

function goToPage(page) {
  state.currentPage = Math.min(Math.max(1, page), state.totalPages);
  if (state.serverPaginated) loadSchemes(); else renderResults();
  document.querySelector('.results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------
   MODAL — SCHEME DETAILS
------------------------------------------------------------------- */
function splitSemicolonItems(value) {
  if (!hasValue(value)) return [];
  return String(value)
    .split(/\s*;\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

function splitList(value) {
  if (!hasValue(value)) return [];
  return String(value)
    .split(/\s*[;\n•|]\s*/)
    .map((part) => part.replace(/^\s*[-–*]+\s*/, '').trim())
    .filter((part) => part.length > 1);
}

function parseLabeledItem(segment) {
  const idx = segment.indexOf(':');
  if (idx > 0 && idx < 70 && !/https?/i.test(segment.slice(0, idx))) {
    return { label: segment.slice(0, idx).trim(), text: segment.slice(idx + 1).trim() };
  }
  return { label: null, text: segment.trim() };
}

function renderBenefitItem(segment) {
  const { label, text } = parseLabeledItem(segment);
  return label
    ? `<li><span class="modal__benefit-item-label">${escapeHtml(label)}:</span> ${escapeHtml(text)}</li>`
    : `<li>${escapeHtml(segment)}</li>`;
}

function buildProcessGroups(items) {
  const groups = [];
  let current = { header: null, steps: [] };

  items.forEach((item) => {
    if (/:$/.test(item) && item.length < 80) {
      if (current.header || current.steps.length) groups.push(current);
      current = { header: item.slice(0, -1).trim(), steps: [] };
    } else {
      current.steps.push(item);
    }
  });
  if (current.header || current.steps.length) groups.push(current);
  return groups;
}

function renderProcessHtml(value) {
  const items = splitSemicolonItems(value);
  if (items.length <= 1) return `<p>${escapeHtml(value)}</p>`;

  const groups = buildProcessGroups(items);

  if (groups.length === 1 && !groups[0].header) {
    return `<ol class="modal__steps">${groups[0].steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`;
  }

  return groups.map((group) => `
    <div class="modal__step-group">
      ${group.header ? `<p class="modal__step-group-title">${escapeHtml(group.header)}</p>` : ''}
      <ol class="modal__steps">${group.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
    </div>`).join('');
}

function openModal(scheme) {
  if (!dom.modalOverlay || !dom.modal) return;
  lastFocusedElement = document.activeElement;

  const icon = pickSchemeIcon(scheme);
  const statusLabel = statusBadgeLabel(scheme.scheme_status);
  const statusMod = statusModifier(scheme.scheme_status);

  const tags = [];
  if (statusLabel) tags.push(`<span class="modal__tag modal__tag--${statusMod}">${escapeHtml(statusLabel)}</span>`);
  if (hasValue(scheme.category_type)) tags.push(`<span class="modal__tag modal__tag--category">${escapeHtml(scheme.category_type)}</span>`);
  if (hasValue(scheme.sub_sector)) tags.push(`<span class="modal__tag">${escapeHtml(scheme.sub_sector)}</span>`);
  if (dom.modalTags) dom.modalTags.innerHTML = tags.join('');

  if (dom.modalTitle) dom.modalTitle.textContent = scheme.scheme_name || 'Untitled scheme';
  if (dom.modalMeta) {
    dom.modalMeta.textContent = hasValue(scheme.issuing_department) ? scheme.issuing_department : '';
    dom.modalMeta.hidden = !hasValue(scheme.issuing_department);
  }

  const header = dom.modalTags?.closest('.modal__header');
  if (header) {
    header.style.setProperty('--icon-bg', icon.bg);
    header.style.setProperty('--icon-color', icon.color);
    let avatar = header.querySelector('.modal__icon');
    if (!avatar) {
      avatar = document.createElement('div');
      avatar.className = 'modal__icon';
      avatar.setAttribute('aria-hidden', 'true');
      header.prepend(avatar);
    }
    avatar.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon.path}</svg>`;
  }

  const sections = [];

  const facts = [];
  if (hasValue(scheme.min_age) || hasValue(scheme.max_age)) facts.push(fact('Age', formatAgeRange(scheme.min_age, scheme.max_age)));
  if (hasValue(scheme.income_limit_annual)) {
    facts.push(fact('Income limit', formatCurrency(scheme.income_limit_annual) + (scheme.is_estimate ? '*' : '')));
  }
  if (hasValue(scheme.application_mode)) facts.push(fact('Apply', scheme.application_mode));
  if (hasValue(scheme.eligibility_state)) facts.push(fact('State', scheme.eligibility_state));
  if (facts.length) sections.push(`<div class="modal__facts">${facts.join('')}</div>`);

  if (hasValue(scheme.benefits)) {
    const benefitItems = splitSemicolonItems(scheme.benefits);
    const benefitHtml = benefitItems.length > 1
      ? `<ul class="modal__benefit-list">${benefitItems.map(renderBenefitItem).join('')}</ul>`
      : `<p>${escapeHtml(scheme.benefits)}</p>`;
    sections.push(`<div class="modal__benefit"><h3>What you get</h3>${benefitHtml}</div>`);
  }

  if (hasValue(scheme.description)) {
    sections.push(section('About this scheme', `<p>${escapeHtml(scheme.description)}</p>`));
  }

  const eligibility = [];
  if (hasValue(scheme.gender_notes) || hasValue(scheme.gender)) eligibility.push(field('Gender', scheme.gender_notes || scheme.gender));
  if (hasValue(scheme.social_category)) eligibility.push(field('Social category', scheme.social_category));
  if (hasValue(scheme.occupation_criteria)) eligibility.push(field('Occupation', scheme.occupation_criteria));
  if (hasValue(scheme.residency_requirement)) eligibility.push(field('Residency', scheme.residency_requirement));
  if (eligibility.length || hasValue(scheme.other_conditions)) {
    let html = eligibility.length ? `<dl class="modal__grid">${eligibility.join('')}</dl>` : '';
    if (hasValue(scheme.other_conditions)) {
      const conditionItems = splitSemicolonItems(scheme.other_conditions);
      html += conditionItems.length > 1
        ? `<ul class="modal__chips modal__chips--block">${conditionItems.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
        : `<p class="modal__note">${escapeHtml(scheme.other_conditions)}</p>`;
    }
    if (scheme.is_estimate && hasValue(scheme.income_limit_annual)) {
      html += `<p class="modal__note">*The income limit is an estimate. Confirm it with the department before applying.</p>`;
    }
    sections.push(section('Who can apply', html));
  }

  if (hasValue(scheme.application_process)) {
    sections.push(section('How to apply', renderProcessHtml(scheme.application_process)));
  }

  const documents = splitList(scheme.required_documents || scheme.mandatory_documents);
  if (documents.length) {
    sections.push(section('Documents to keep ready',
      `<ul class="modal__chips">${documents.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`));
  }

  const sourceItems = [];
  if (hasValue(scheme.last_verified_date)) sourceItems.push(field('Last verified', formatDate(scheme.last_verified_date)));
  if (hasValue(scheme.source_platform)) sourceItems.push(field('Source', scheme.source_platform));
  if (hasValue(scheme.official_source_url)) {
    sourceItems.push(field('Official page', `<a href="${escapeHtml(scheme.official_source_url)}" target="_blank" rel="noopener noreferrer">Open government page</a>`, true));
  }
  if (sourceItems.length) sections.push(section('Where this came from', `<dl class="modal__grid">${sourceItems.join('')}</dl>`));

  if (dom.modalBody) {
    dom.modalBody.innerHTML = sections.join('');
    dom.modalBody.scrollTop = 0;
  }

  if (dom.modalFooter) {
    const footerButtons = [];
    if (hasValue(scheme.application_url)) {
      footerButtons.push(`<a class="btn btn--primary" href="${escapeHtml(scheme.application_url)}" target="_blank" rel="noopener noreferrer">Apply on the official site</a>`);
    } else if (hasValue(scheme.official_source_url)) {
      footerButtons.push(`<a class="btn btn--primary" href="${escapeHtml(scheme.official_source_url)}" target="_blank" rel="noopener noreferrer">Open government page</a>`);
    }
    footerButtons.push('<button type="button" class="btn btn-ghost" id="modalFooterClose">Close</button>');
    dom.modalFooter.innerHTML = footerButtons.join('');
    document.getElementById('modalFooterClose')?.addEventListener('click', closeModal);
  }
    
  syncDrawerOffset();
  dom.modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  dom.modal.focus();
  document.addEventListener('keydown', handleModalKeydown);
}

function section(title, bodyHtml) {
  return `<section class="modal__section"><h3>${escapeHtml(title)}</h3>${bodyHtml}</section>`;
}

function field(label, value, isHtml = false) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${isHtml ? value : escapeHtml(value)}</dd></div>`;
}

function fact(label, value) {
  return `<div class="modal__fact"><span class="modal__fact-label">${escapeHtml(label)}</span><span class="modal__fact-value">${escapeHtml(value)}</span></div>`;
}

function formatAgeRange(minAge, maxAge) {
  if (hasValue(minAge) && hasValue(maxAge)) return `${minAge}–${maxAge} yrs`;
  if (hasValue(minAge)) return `${minAge}+ yrs`;
  return `Up to ${maxAge} yrs`;
}

function closeModal() {
  if (!dom.modalOverlay) return;
  dom.modalOverlay.hidden = true;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleModalKeydown);
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
}

/* Keep the drawer just below the navbar, whatever its height on this screen size */
function syncDrawerOffset() {
  if (!dom.modalOverlay) return;
  const navbar = document.getElementById('appNavbar');
  const bottom = navbar ? Math.max(0, Math.round(navbar.getBoundingClientRect().bottom)) : 0;
  dom.modalOverlay.style.setProperty('--drawer-top', `${bottom}px`);
}

function handleModalKeydown(event) {
  if (event.key === 'Escape') { closeModal(); return; }
  if (event.key === 'Tab') trapFocus(event);
}

function trapFocus(event) {
  if (!dom.modal) return;
  const focusable = dom.modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

/* ------------------------------------------------------------------
   EVENT WIRING
------------------------------------------------------------------- */
function wireSearch() {
  if (!dom.searchInput) return;
  const debouncedSearch = debounce(() => {
    state.search = dom.searchInput.value;
    loadSchemes({ resetPage: true });
  }, SEARCH_DEBOUNCE_MS);
  dom.searchInput.addEventListener('input', debouncedSearch);
}

function wireFilters() {
  const map = [
    [dom.filterCategory, 'category'],
    [dom.filterSector, 'sector'],
    [dom.filterGender, 'gender'],
    [dom.filterStatus, 'status'],
  ];
  map.forEach(([el, key]) => {
    if (el) {
      el.addEventListener('change', () => {
        state.filters[key] = el.value;
        loadSchemes({ resetPage: true });
      });
    }
  });

  if (dom.resetFiltersBtn) dom.resetFiltersBtn.addEventListener('click', resetFilters);
  if (dom.emptyResetBtn) dom.emptyResetBtn.addEventListener('click', resetFilters);
}

function resetFilters() {
  Object.keys(state.filters).forEach((key) => { state.filters[key] = 'all'; });
  state.search = '';
  if (dom.searchInput) dom.searchInput.value = '';
  [dom.filterCategory, dom.filterSector, dom.filterGender, dom.filterStatus].forEach((el) => {
    if (el) el.value = 'all';
  });
  loadSchemes({ resetPage: true });
}

function wireModal() {
  if (dom.modalCloseBtn) dom.modalCloseBtn.addEventListener('click', closeModal);
  if (dom.modalOverlay) {
    dom.modalOverlay.addEventListener('click', (event) => {
      if (event.target === dom.modalOverlay) closeModal();
    });
  }
  window.addEventListener('resize', syncDrawerOffset);
}

function wireRetry() {
  if (dom.retryBtn) dom.retryBtn.addEventListener('click', () => loadSchemes());
}

/* ------------------------------------------------------------------
   INIT
------------------------------------------------------------------- */
async function init() {
  wireSearch();
  wireFilters();
  wireModal();
  wireRetry();

  await initNavbarAuth();
  await loadSchemes({ resetPage: true });
}

init();