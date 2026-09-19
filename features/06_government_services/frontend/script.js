/* ==========================================================================
   UNIORA — Government Services Nearby
   Feature 06: Government Services
   ========================================================================== */

import { supabase } from '../../../common/js/supabase.js';

import {
  getCurrentUser
} from '../../../common/js/auth.js';

import {
  initNavbarAuth,
  initActiveNavLink,
  initNavbarMenu
} from '../../../common/js/navbar.js';


// ==========================================================================
// CONFIGURATION
// ==========================================================================

const TALUKS_URL = '../../../common/data/taluks.json';

const GOOGLE_MAPS_SEARCH_URL =
  'https://www.google.com/maps/search/?api=1&query=';


// ==========================================================================
// OFFICE TYPES
// ==========================================================================

const OFFICE_TYPES = [
  {
    name: 'District Collectorate',
    icon: 'building',
    color: '#2563eb',
    description: 'District-level administration and government services.',
    query: (district, taluk) =>
      `District Collectorate ${district} Tamil Nadu`
  },

  {
    name: 'Taluk Office',
    icon: 'government',
    color: '#059669',
    description: 'Revenue and citizen services at the taluk level.',
    query: (district, taluk) =>
      `Taluk Office ${taluk} ${district} Tamil Nadu`
  },

  {
    name: 'Arasu e-Sevai Centre',
    icon: 'computer',
    color: '#7c3aed',
    description: 'Citizen access point for government e-services.',
    query: (district, taluk) =>
      `Arasu e-Sevai Centre ${taluk} ${district} Tamil Nadu`
  },

  {
    name: 'Revenue Divisional Office',
    icon: 'office',
    color: '#0891b2',
    description: 'Revenue administration and related government services.',
    query: (district, taluk) =>
      `Revenue Divisional Office ${district} Tamil Nadu`
  },

  {
    name: 'Regional Transport Office',
    icon: 'transport',
    color: '#ea580c',
    description: 'Transport-related government services and licensing.',
    query: (district, taluk) =>
      `Regional Transport Office ${district} Tamil Nadu`
  },

  {
    name: 'Employment Office',
    icon: 'employment',
    color: '#ca8a04',
    description: 'Government employment and career-related services.',
    query: (district, taluk) =>
      `Employment Office ${district} Tamil Nadu`
  },

  {
    name: 'Civil Supplies / Ration Office',
    icon: 'ration',
    color: '#dc2626',
    description: 'Public distribution and civil supplies services.',
    query: (district, taluk) =>
      `Civil Supplies Office ${taluk} ${district} Tamil Nadu`
  },

  {
    name: 'Social Welfare Office',
    icon: 'welfare',
    color: '#db2777',
    description: 'Social welfare schemes and citizen support services.',
    query: (district, taluk) =>
      `Social Welfare Office ${district} Tamil Nadu`
  },

  {
    name: 'Adi Dravidar Welfare Office',
    icon: 'welfare',
    color: '#9333ea',
    description: 'Government welfare services under the department.',
    query: (district, taluk) =>
      `Adi Dravidar Welfare Office ${district} Tamil Nadu`
  },

  {
    name: 'Municipality / Panchayat Office',
    icon: 'local',
    color: '#4f46e5',
    description: 'Local government and civic administration services.',
    query: (district, taluk) =>
      `Municipality Panchayat Office ${taluk} ${district} Tamil Nadu`
  }
];


// ==========================================================================
// STATE
// ==========================================================================

const state = {
  isLoggedIn: false,
  user: null,
  district: '',
  taluk: '',
  taluksData: {},
  loading: true
};


// ==========================================================================
// DOM ELEMENTS
// ==========================================================================

const elements = {
  districtLocked: document.getElementById('districtLocked'),
  districtLockedName: document.getElementById('districtLockedName'),

  districtInputWrap: document.getElementById('districtInputWrap'),
  districtInput: document.getElementById('districtInput'),

  talukSelect: document.getElementById('talukSelect'),

  loginPromptText: document.getElementById('loginPromptText'),

  promptState: document.getElementById('promptState'),
  officesSection: document.getElementById('officesSection'),
  officesGrid: document.getElementById('officesGrid'),

  locationLabel: document.getElementById('locationLabel'),

  esevaLink: document.getElementById('esevaiLink'),
  nearMeLink: document.getElementById('nearMeLink')
};


// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {

    initActiveNavLink();
    initNavbarMenu();

    await initNavbarAuth();

    await loadTaluks();

    await initializeUser();

    setupEventListeners();

    updateQuickAccessLinks();

  } catch (error) {

    console.error(
      '[UNIORA Government Services] Initialization failed:',
      error
    );

    showErrorState(
      'Unable to load Government Services',
      'Please refresh the page and try again.'
    );

  } finally {

    state.loading = false;

  }
});


// ==========================================================================
// LOAD TALUK DATA
// ==========================================================================

async function loadTaluks() {

  const response = await fetch(TALUKS_URL, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load taluks.json (${response.status})`
    );
  }

  const data = await response.json();

  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new Error('Invalid taluks.json format.');
  }

  state.taluksData = data;

  /*
   * Districts come directly from the keys of taluks.json.
   *
   * Example:
   *
   * {
   *   "Ariyalur": [...],
   *   "Chengalpattu": [...],
   *   "Coimbatore": [...]
   * }
   */

  populateDistrictDropdown();
}


// ==========================================================================
// POPULATE DISTRICT DROPDOWN
// ==========================================================================

function populateDistrictDropdown() {

  if (!elements.districtInput) return;

  /*
   * We are reusing the existing #districtInput element,
   * but changing it into a <select> through JavaScript.
   *
   * This means the HTML does not need a manual list of districts.
   */

  const currentElement = elements.districtInput;

  const select = document.createElement('select');

  select.id = 'districtInput';
  select.className = 'location-select';
  select.setAttribute(
    'aria-label',
    'Select your district'
  );

  const defaultOption = document.createElement('option');

  defaultOption.value = '';
  defaultOption.textContent = 'Select district';

  select.appendChild(defaultOption);

  const districts = Object.keys(state.taluksData)
    .sort((a, b) => a.localeCompare(b));

  districts.forEach((district) => {

    const option = document.createElement('option');

    option.value = district;
    option.textContent = district;

    select.appendChild(option);

  });

  /*
   * Replace the existing input.
   */

  currentElement.replaceWith(select);

  /*
   * Update reference.
   */

  elements.districtInput = select;
}


// ==========================================================================
// USER / AUTH INITIALIZATION
// ==========================================================================

async function initializeUser() {

  let user = null;

  try {

    user = await getCurrentUser();

  } catch (error) {

    console.warn(
      '[UNIORA Government Services] Unable to get current user:',
      error
    );

  }

  state.user = user;
  state.isLoggedIn = Boolean(user);

  if (!user) {

    initializeGuestMode();

    return;
  }

  const district = await getUserDistrict(user);

  const matchedDistrict =
    getMatchingDistrict(district);

  if (matchedDistrict) {

    initializeLoggedInMode(
      matchedDistrict
    );

  } else {

    /*
     * Logged in but district is unavailable
     * in USER_INFO.
     *
     * Allow manual district selection.
     */

    initializeManualMode(true);

  }
}


// ==========================================================================
// GET USER DISTRICT
// ==========================================================================

async function getUserDistrict(user) {

  if (!supabase || !user?.id) {
    return '';
  }

  try {

    const { data, error } = await supabase
      .from('user_info')
      .select('district')
      .eq('uid', user.id)
      .maybeSingle();

    if (error) {

      console.warn(
        '[UNIORA Government Services] USER_INFO lookup failed:',
        error
      );

      return '';
    }

    return String(
      data?.district || ''
    ).trim();

  } catch (error) {

    console.warn(
      '[UNIORA Government Services] District lookup failed:',
      error
    );

    return '';
  }
}


// ==========================================================================
// LOGGED-IN MODE
// ==========================================================================

function initializeLoggedInMode(district) {

  state.district = district;

  /*
   * Show locked district.
   */

  if (elements.districtLocked) {
    elements.districtLocked.hidden = false;
  }

  if (elements.districtLockedName) {
    elements.districtLockedName.textContent =
      district;
  }

  /*
   * Hide manual district selector.
   */

  if (elements.districtInputWrap) {
    elements.districtInputWrap.hidden = true;
  }

  /*
   * Hide login message.
   */

  if (elements.loginPromptText) {
    elements.loginPromptText.hidden = true;
  }

  /*
   * Populate taluks.
   */

  populateTalukDropdown(district);
}


// ==========================================================================
// GUEST MODE
// ==========================================================================

function initializeGuestMode() {

  state.district = '';
  state.taluk = '';

  initializeManualMode(false);
}


// ==========================================================================
// MANUAL DISTRICT MODE
// ==========================================================================

function initializeManualMode(
  loggedInWithoutDistrict = false
) {

  /*
   * Hide locked district.
   */

  if (elements.districtLocked) {
    elements.districtLocked.hidden = true;
  }

  /*
   * Show district dropdown.
   */

  if (elements.districtInputWrap) {
    elements.districtInputWrap.hidden = false;
  }

  /*
   * Show login prompt only for guests.
   */

  if (elements.loginPromptText) {

    elements.loginPromptText.hidden =
      state.isLoggedIn;

  }

  /*
   * Reset district selection.
   */

  if (elements.districtInput) {
    elements.districtInput.value = '';
  }

  resetTalukDropdown();

  hideOfficeResults();
}


// ==========================================================================
// DISTRICT SELECTION
// ==========================================================================

function handleDistrictChange() {

  const selectedDistrict =
    String(
      elements.districtInput?.value || ''
    ).trim();

  const matchedDistrict =
    getMatchingDistrict(
      selectedDistrict
    );

  if (!matchedDistrict) {

    state.district = '';
    state.taluk = '';

    resetTalukDropdown();

    hideOfficeResults();

    return;
  }

  state.district =
    matchedDistrict;

  state.taluk = '';

  populateTalukDropdown(
    matchedDistrict
  );

  updateQuickAccessLinks();
}


// ==========================================================================
// DISTRICT MATCHING
// ==========================================================================

function getMatchingDistrict(value) {

  const input =
    normalizeText(value);

  if (!input) {
    return '';
  }

  const districts =
    Object.keys(state.taluksData);

  /*
   * Exact match.
   */

  const exact =
    districts.find(
      district =>
        normalizeText(district) === input
    );

  if (exact) {
    return exact;
  }

  /*
   * Common naming variations.
   */

  const aliases = {

    'kanchipuram':
      'Kancheepuram',

    'kancheepuram':
      'Kancheepuram',

    'villupuram':
      'Villupuram',

    'viluppuram':
      'Villupuram',

    'nilgiri':
      'Nilgiris',

    'the nilgiris':
      'Nilgiris'

  };

  const alias =
    aliases[input];

  if (
    alias &&
    state.taluksData[alias]
  ) {
    return alias;
  }

  return '';
}


// ==========================================================================
// TALUK DROPDOWN
// ==========================================================================

function populateTalukDropdown(
  district
) {

  if (!elements.talukSelect) {
    return;
  }

  const taluks =
    state.taluksData[district] || [];

  elements.talukSelect.innerHTML = '';

  const defaultOption =
    document.createElement('option');

  defaultOption.value = '';

  defaultOption.textContent =
    taluks.length
      ? 'Select taluk'
      : 'No taluks available';

  elements.talukSelect.appendChild(
    defaultOption
  );

  taluks.forEach((taluk) => {

    const option =
      document.createElement('option');

    option.value = taluk;
    option.textContent = taluk;

    elements.talukSelect.appendChild(
      option
    );

  });

  elements.talukSelect.disabled =
    taluks.length === 0;

  state.taluk = '';

  hideOfficeResults();
}


// ==========================================================================
// RESET TALUK
// ==========================================================================

function resetTalukDropdown() {

  if (!elements.talukSelect) {
    return;
  }

  elements.talukSelect.innerHTML = '';

  const option =
    document.createElement('option');

  option.value = '';

  option.textContent =
    'Select district first';

  elements.talukSelect.appendChild(
    option
  );

  elements.talukSelect.disabled =
    true;

  state.taluk = '';
}


// ==========================================================================
// TALUK SELECTION
// ==========================================================================

function handleTalukChange() {

  const taluk =
    String(
      elements.talukSelect?.value || ''
    ).trim();

  state.taluk = taluk;

  if (
    !state.district ||
    !taluk
  ) {

    hideOfficeResults();

    return;
  }

  renderOfficeCards();
}


// ==========================================================================
// RENDER OFFICE CARDS
// ==========================================================================

function renderOfficeCards() {

  if (!elements.officesGrid) {
    return;
  }

  if (
    !state.district ||
    !state.taluk
  ) {

    hideOfficeResults();

    return;
  }

  elements.officesGrid.innerHTML = '';

  OFFICE_TYPES.forEach(
    (office) => {

      const card =
        createOfficeCard(
          office,
          state.district,
          state.taluk
        );

      elements.officesGrid.appendChild(
        card
      );

    }
  );

  if (elements.locationLabel) {

    elements.locationLabel.textContent =
      `${state.taluk}, ${state.district}`;

  }

  if (elements.promptState) {
    elements.promptState.hidden = true;
  }

  if (elements.officesSection) {
    elements.officesSection.hidden = false;
  }

  updateQuickAccessLinks();
}


// ==========================================================================
// CREATE OFFICE CARD
// ==========================================================================

function createOfficeCard(
  office,
  district,
  taluk
) {

  const article =
    document.createElement('article');

  article.className =
    'office-card';

  article.setAttribute(
    'role',
    'listitem'
  );

  article.style.setProperty(
    '--card-color',
    office.color
  );

  article.style.setProperty(
    '--icon-color',
    office.color
  );

  article.style.setProperty(
    '--icon-bg',
    hexToLightBackground(
      office.color
    )
  );

  const query =
    office.query(
      district,
      taluk
    );

  const mapsUrl =
    GOOGLE_MAPS_SEARCH_URL +
    encodeURIComponent(query);

  article.innerHTML = `

    <div class="office-card__strip"></div>

    <div class="office-card__inner">

      <div class="office-card__head">

        <div class="office-card__icon">
          ${getOfficeIcon(office.icon)}
        </div>

        <div>

          <h3 class="office-card__name">
            ${escapeHtml(office.name)}
          </h3>

        </div>

      </div>

      <div class="office-card__info">

        <div class="office-card__info-row">

          <span class="office-card__info-label">
            District
          </span>

          <span
            class="office-card__info-value"
            title="${escapeHtml(district)}"
          >
            ${escapeHtml(district)}
          </span>

        </div>

        <div class="office-card__info-row">

          <span class="office-card__info-label">
            Taluk
          </span>

          <span
            class="office-card__info-value"
            title="${escapeHtml(taluk)}"
          >
            ${escapeHtml(taluk)}
          </span>

        </div>

      </div>

      <p class="office-card__desc">
        ${escapeHtml(office.description)}
      </p>

      <div class="office-card__footer">

        <a
          class="office-card__map-btn"
          href="${mapsUrl}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Search ${escapeHtml(office.name)} on Google Maps"
        >

          ${getMapIcon()}

          Open in Google Maps

        </a>

      </div>

    </div>

  `;

  return article;
}


// ==========================================================================
// QUICK ACCESS LINKS
// ==========================================================================

function updateQuickAccessLinks() {

  if (!elements.esevaLink) {
    return;
  }

  let eseVaiQuery =
    'Arasu e-Sevai Centre Tamil Nadu';

  if (
    state.district &&
    state.taluk
  ) {

    eseVaiQuery =
      `Arasu e-Sevai Centre ${state.taluk} ${state.district} Tamil Nadu`;

  } else if (state.district) {

    eseVaiQuery =
      `Arasu e-Sevai Centre ${state.district} Tamil Nadu`;

  }

  elements.esevaLink.href =
    GOOGLE_MAPS_SEARCH_URL +
    encodeURIComponent(
      eseVaiQuery
    );

  if (elements.nearMeLink) {

    elements.nearMeLink.href =
      'https://www.google.com/maps/search/?api=1&query=government+offices+near+me';

  }
}


// ==========================================================================
// HIDE RESULTS
// ==========================================================================

function hideOfficeResults() {

  if (elements.promptState) {
    elements.promptState.hidden = false;
  }

  if (elements.officesSection) {
    elements.officesSection.hidden = true;
  }

  if (elements.officesGrid) {
    elements.officesGrid.innerHTML = '';
  }
}


// ==========================================================================
// ERROR STATE
// ==========================================================================

function showErrorState(
  title,
  message
) {

  if (elements.promptState) {

    elements.promptState.hidden = false;

    elements.promptState.innerHTML = `

      <div class="state-panel__icon">
        ${getErrorIcon()}
      </div>

      <p class="state-panel__title">
        ${escapeHtml(title)}
      </p>

      <p class="state-panel__text">
        ${escapeHtml(message)}
      </p>

    `;
  }

  if (elements.officesSection) {
    elements.officesSection.hidden = true;
  }
}


// ==========================================================================
// EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {

  /*
   * Logged-out users select district
   * from the dropdown generated from
   * taluks.json.
   */

  if (elements.districtInput) {

    elements.districtInput.addEventListener(
      'change',
      handleDistrictChange
    );

  }

  /*
   * Taluk selection.
   */

  if (elements.talukSelect) {

    elements.talukSelect.addEventListener(
      'change',
      handleTalukChange
    );

  }
}


// ==========================================================================
// HELPERS
// ==========================================================================

function normalizeText(value) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

}


function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


function hexToLightBackground(hex) {

  const value =
    String(hex || '')
      .replace('#', '');

  if (value.length !== 6) {
    return '#eff6ff';
  }

  const r =
    parseInt(
      value.substring(0, 2),
      16
    );

  const g =
    parseInt(
      value.substring(2, 4),
      16
    );

  const b =
    parseInt(
      value.substring(4, 6),
      16
    );

  const mix =
    channel =>
      Math.round(
        channel +
        (255 - channel) * 0.90
      );

  return `rgb(
    ${mix(r)},
    ${mix(g)},
    ${mix(b)}
  )`;

}


// ==========================================================================
// ICONS
// ==========================================================================

function getOfficeIcon(type) {

  const common =
    'width="22" height="22" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"';

  const icons = {

    building: `
      <svg ${common}>
        <path d="M3 21h18"/>
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
        <path d="M9 7h2"/>
        <path d="M13 7h2"/>
        <path d="M9 11h2"/>
        <path d="M13 11h2"/>
        <path d="M9 15h2"/>
        <path d="M13 15h2"/>
      </svg>
    `,

    government: `
      <svg ${common}>
        <path d="M3 10h18"/>
        <path d="M5 10v9"/>
        <path d="M9 10v9"/>
        <path d="M15 10v9"/>
        <path d="M19 10v9"/>
        <path d="M2 19h20"/>
        <path d="M12 3l9 5H3l9-5z"/>
      </svg>
    `,

    computer: `
      <svg ${common}>
        <rect x="3" y="4" width="18" height="12" rx="2"/>
        <path d="M8 20h8"/>
        <path d="M12 16v4"/>
      </svg>
    `,

    office: `
      <svg ${common}>
        <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/>
        <path d="M8 7h2"/>
        <path d="M14 7h2"/>
        <path d="M8 11h2"/>
        <path d="M14 11h2"/>
        <path d="M8 15h2"/>
        <path d="M14 15h2"/>
        <path d="M10 21v-3h4v3"/>
      </svg>
    `,

    transport: `
      <svg ${common}>
        <rect x="4" y="3" width="16" height="15" rx="3"/>
        <path d="M4 11h16"/>
        <path d="M8 18v3"/>
        <path d="M16 18v3"/>
        <circle cx="8" cy="15" r="1"/>
        <circle cx="16" cy="15" r="1"/>
      </svg>
    `,

    employment: `
      <svg ${common}>
        <rect x="3" y="7" width="18" height="13" rx="2"/>
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <path d="M3 12h18"/>
        <path d="M10 12v2h4v-2"/>
      </svg>
    `,

    ration: `
      <svg ${common}>
        <path d="M4 6h16v14H4z"/>
        <path d="M8 6V4h8v2"/>
        <path d="M8 10h8"/>
        <path d="M8 14h5"/>
      </svg>
    `,

    welfare: `
      <svg ${common}>
        <path d="M20 12c0 5-8 9-8 9s-8-4-8-9a4 4 0 0 1 7-2.6A4 4 0 0 1 20 12z"/>
      </svg>
    `,

    local: `
      <svg ${common}>
        <path d="M3 21h18"/>
        <path d="M5 21V9l7-5 7 5v12"/>
        <path d="M9 21v-6h6v6"/>
        <path d="M9 10h.01"/>
        <path d="M15 10h.01"/>
      </svg>
    `

  };

  return (
    icons[type] ||
    icons.building
  );
}


function getMapIcon() {

  return `
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>
  `;

}


function getErrorIcon() {

  return `
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v4"/>
      <circle cx="12" cy="16" r="1"/>
    </svg>
  `;

}
