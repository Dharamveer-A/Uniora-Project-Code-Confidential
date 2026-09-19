/* ==========================================================================
   UNIORA PLATFORM — COMMON DASHBOARD SCRIPT
   File: dashboard/script.js
   ========================================================================== */

import { getCurrentUser, resolveAuthRoute } from '../common/js/auth.js';
import { supabase } from '../common/js/supabase.js';
import { initNavbarAuth, initActiveNavLink, initNavbarMenu } from '../common/js/navbar.js';
import { $, setText } from '../common/js/common.js';


/* ==========================================================================
   EXAMPLE SCHEMES DATASET (577+ Schemes engine)
   ========================================================================== */

const SCHEMES_DATASET = [
  {
    scheme_id: "ASTPSS",
    scheme_name: "AICTE SHORT TERM TRAINING PROGRAMME-SFURTI SCHEME",
    category_type: "Central",
    sector_category: "Education & Learning",
    issuing_department: "Department of Higher Education; Ministry of Education",
    eligibility_state: "Resident of India",
    description: "Short Term Training Programme-SFURTI Program aims to provide financial assistance from AICTE to institutions.",
    benefits: "Financial Assistance: Funding limit of ₹ 4,00,000 to the institution for conducting training programs.",
    application_mode: "Online",
    application_url: "http://portal.aicte-india.org/partnerportalenu/start.swe"
  },
  {
    scheme_id: "ECSSL",
    scheme_name: "Employees Cooperative Societies Surety Loan",
    category_type: "State - Tamil Nadu",
    sector_category: "Banking & Financial Services",
    issuing_department: "Co-operation; Food and Consumer Protection Department",
    eligibility_state: "Resident of Tamil Nadu",
    description: "Assisting citizens by offering financial support through surety loans from Employees Cooperative Societies.",
    benefits: "Surety loans up to ₹ 1,50,000 at an interest rate of 14%.",
    application_mode: "Offline",
    application_url: "https://www.tn.gov.in/scheme/data_view/3616"
  },
  {
    scheme_id: "DAY-NRLM",
    scheme_name: "Deendayal Antyodaya Yojana - National Rural Livelihoods Mission",
    category_type: "Central",
    sector_category: "Rural Development & Livelihoods",
    issuing_department: "Ministry of Rural Development (MoRD)",
    eligibility_state: "Resident of Rural India",
    description: "Flagship poverty reduction programme aiming to build strong grassroots institutions of poor households.",
    benefits: "SHG bank linkage, revolving fund support, interest subvention on SHG loans.",
    application_mode: "Online",
    application_url: "https://aajeevika.gov.in/en/member/register"
  },
  {
    scheme_id: "DAY-NULM",
    scheme_name: "Deendayal Antyodaya Yojana - National Urban Livelihoods Mission",
    category_type: "Central",
    sector_category: "Urban Development & Skill Development",
    issuing_department: "Ministry of Housing and Urban Affairs (MoHUA)",
    eligibility_state: "Urban Poor / All India",
    description: "Equips urban poor with skill training, micro-enterprise loans, and self-employment support.",
    benefits: "Financial assistance for setting up individual and group micro-enterprises.",
    application_mode: "Online",
    application_url: "https://nulm.gov.in/"
  }
];

/* ==========================================================================
   INITIALIZE DASHBOARD ON DOM READY
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Start live IST clock
  initISTDigitalClock();

  // 2. Ensure navbar controls & active feature links are initialized
  initActiveNavLink();
  initNavbarMenu();

  // 3. Signed-in users must finish their profile first.
  //    Signed-out visitors can still browse the dashboard.
  try {
    const { route, error } = await resolveAuthRoute();
    if (route === 'signup' && !error) {
      window.location.replace('../auth/signup/index.html');
      return;
    }
  } catch (err) {
    console.warn('[UNIORA Dashboard] Profile check failed:', err);
  }

  // 4. Initialize navbar auth state (0ms flicker free)
  await initNavbarAuth();

  // 5. Load welcome heading
  await loadWelcomeHeading();

  // 6. Initialize Scheme Search Engine
  initSchemeSearch();
});

/* ==========================================================================
   LIVE INDIAN STANDARD TIME (IST) DIGITAL CLOCK & DATE
   ========================================================================== */

function initISTDigitalClock() {
  const clockElement = document.getElementById('istDigitalClock');
  const dateElement = document.getElementById('istDigitalDate');

  function updateClock() {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const istDate = new Date(utcMs + istOffsetMs);

    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    const seconds = String(istDate.getSeconds()).padStart(2, '0');

    if (clockElement) {
      clockElement.textContent = `${hours}:${minutes}:${seconds} IST`;
    }

    if (dateElement) {
      const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      dateElement.textContent = istDate.toLocaleDateString('en-IN', options);
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   LOAD WELCOME HEADING
   ========================================================================== */

async function loadWelcomeHeading() {
  const welcomeHeading = $('#welcomeHeading');
  let displayName = null;

  try {
    const user = await getCurrentUser();

    if (user) {
      displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.preferred_username ||
        user.email?.split('@')[0] ||
        'Citizen';

      if (supabase && user.id) {
        try {
          const { data: profile, error } = await supabase
            .from('user_profile')
            .select('name')
            .eq('uid', user.id)
            .maybeSingle();

          if (!error && profile?.name) {
            displayName = profile.name;
          }
        } catch (err) {
          console.warn('[UNIORA Dashboard] USER_PROFILE lookup failed:', err);
        }
      }
    }
  } catch (error) {
    console.warn('[UNIORA Dashboard] getCurrentUser error:', error);
  }

  if (welcomeHeading) {
    if (displayName) {
      setText(welcomeHeading, `Welcome, ${displayName}`);
    } else {
      setText(welcomeHeading, 'Welcome to UNIORA');
    }
  }
}

/* ==========================================================================
   SCHEME LIVE SEARCH ENGINE (577 Schemes Search)
   ========================================================================== */

function initSchemeSearch() {
  const searchInput = document.getElementById('schemeSearchInput');
  const clearBtn = document.getElementById('searchClearBtn');
  const container = document.getElementById('searchResultsContainer');
  const countEl = document.getElementById('searchResultsCount');
  const gridEl = document.getElementById('searchResultsGrid');

  if (!searchInput || !container || !gridEl) return;

  function performSearch(query) {
    const q = String(query || '').trim().toLowerCase();

    if (!q) {
      container.hidden = true;
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    if (clearBtn) clearBtn.hidden = false;

    const results = SCHEMES_DATASET.filter(s => {
      return (
        s.scheme_id.toLowerCase().includes(q) ||
        s.scheme_name.toLowerCase().includes(q) ||
        s.sector_category.toLowerCase().includes(q) ||
        s.issuing_department.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.eligibility_state.toLowerCase().includes(q)
      );
    });

    container.hidden = false;
    countEl.textContent = results.length > 0 
      ? `Found ${results.length} matching scheme(s) for "${query}"`
      : `No direct local matches for "${query}". Search full database in Scheme Discovery...`;

    gridEl.innerHTML = '';

    if (results.length === 0) {
      gridEl.innerHTML = `
        <div class="scheme-result-card" style="grid-column: 1 / -1;">
          <div class="result-title">Search 577+ Central &amp; Tamil Nadu State Schemes</div>
          <div class="result-desc">Explore full criteria match in Scheme Discovery module for "${query}".</div>
          <div class="result-card-bottom">
            <a href="/features/01_scheme_recommendation/frontend/index.html?search=${encodeURIComponent(query)}" class="result-link">Open Scheme Discovery ↗</a>
          </div>
        </div>
      `;
      return;
    }

    results.forEach(s => {
      const card = document.createElement('div');
      card.className = 'scheme-result-card';
      card.innerHTML = `
        <div class="result-card-top">
          <span class="result-badge">${s.scheme_id}</span>
          <span style="font-size:11px; font-weight:700; color:#0284C7;">${s.category_type}</span>
        </div>
        <h4 class="result-title">${s.scheme_name}</h4>
        <div class="result-dept">${s.issuing_department}</div>
        <p class="result-desc">${s.description}</p>
        <div class="result-card-bottom">
          <span style="font-size:11px; color:#16A34A; font-weight:700;">Mode: ${s.application_mode}</span>
          <a href="${s.application_url}" target="_blank" rel="noopener noreferrer" class="result-link">Official Portal ↗</a>
        </div>
      `;
      gridEl.appendChild(card);
    });
  }

  searchInput.addEventListener('input', (e) => performSearch(e.target.value));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      performSearch('');
      searchInput.focus();
    });
  }
}