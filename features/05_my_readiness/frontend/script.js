import { supabase } from '../../../common/js/supabase.js';
import { getCurrentUser, getCurrentSession, onAuthStateChange } from '../../../common/js/auth.js';
import { initNavbarAuth, initActiveNavLink, initNavbarMenu } from '../../../common/js/navbar.js';

const SECRET_KEY = 'uniora_secure_2024';

// ---------------------------------------------------------------------------
// COMPREHENSIVE SCHEME CATALOG DATASET (16+ Welfare Schemes)
// ---------------------------------------------------------------------------

const FALLBACK_SCHEMES = [
  {
    id: 'TN-HE-001',
    name: 'Tamil Pudhalvan Scheme',
    department: 'Higher Education Department (Tamil Nadu)',
    level: 'Tamil Nadu',
    summary: '₹1,000 monthly higher education stipend for male students from TN Govt schools.',
    benefits: '₹1,000 per month direct bank transfer throughout undergraduate degree duration.',
    application_url: 'https://www.tn.gov.in',
    requiredFields: ['age', 'gender', 'state', 'occupation', 'annual_income', 'education'],
    requiredDocs: ['Aadhaar Card', 'Bonafide Certificate', 'Bank Passbook', '12th Marksheet'],
    rules: { minAge: 17, maxAge: 25, gender: 'Male', state: 'Tamil Nadu', occupation: 'Student', maxIncome: 300000 }
  },
  {
    id: 'TN-SW-002',
    name: 'Pudhumai Penn Scheme (Moovalur Ramamirtham)',
    department: 'Social Welfare & Women Rights (TN)',
    level: 'Tamil Nadu',
    summary: '₹1,000 monthly higher education assistance for girl students from TN Govt schools.',
    benefits: '₹1,000/month direct bank transfer until degree/diploma completion.',
    application_url: 'https://www.penkalvi.tn.gov.in',
    requiredFields: ['age', 'gender', 'state', 'occupation', 'annual_income', 'education'],
    requiredDocs: ['Aadhaar Card', 'Bonafide Certificate', 'Bank Passbook', '10th Marksheet'],
    rules: { minAge: 17, maxAge: 26, gender: 'Female', state: 'Tamil Nadu', occupation: 'Student', maxIncome: 350000 }
  },
  {
    id: 'TN-SD-003',
    name: 'Naan Mudhalvan Scheme',
    department: 'Skill Development & Employment (TN)',
    level: 'Tamil Nadu',
    summary: 'Industry-aligned skill development and job placement program for students.',
    benefits: 'Free certification courses, industry hackathons, and campus placement assistance.',
    application_url: 'https://www.naanmudhalvan.tn.gov.in',
    requiredFields: ['age', 'state', 'occupation', 'education'],
    requiredDocs: ['Aadhaar Card', 'Bonafide Certificate'],
    rules: { minAge: 17, maxAge: 29, state: 'Tamil Nadu', occupation: 'Student' }
  },
  {
    id: 'TN-SW-004',
    name: 'Kalaignar Magalir Urimai Thogai',
    department: 'Social Welfare & Women Rights (TN)',
    level: 'Tamil Nadu',
    summary: '₹1,000/month basic income entitlement for female heads of families.',
    benefits: '₹1,000 direct benefit transfer on the 15th of every month.',
    application_url: 'https://kmut.tn.gov.in',
    requiredFields: ['age', 'gender', 'state', 'annual_income', 'social_category'],
    requiredDocs: ['Smart Ration Card', 'Aadhaar Card', 'Electricity Bill', 'Bank Passbook'],
    rules: { minAge: 21, maxAge: 65, gender: 'Female', state: 'Tamil Nadu', maxIncome: 250000 }
  },
  {
    id: 'TN-RD-005',
    name: 'Kalaignar Kanavu Illam',
    department: 'Rural Development (TN)',
    level: 'Tamil Nadu',
    summary: 'Reconstruction and building of safe concrete houses in rural Tamil Nadu.',
    benefits: '₹3.5 Lakh financial unit grant for house construction.',
    application_url: 'https://tnrd.tn.gov.in',
    requiredFields: ['age', 'state', 'annual_income', 'residence'],
    requiredDocs: ['Land Ownership Document', 'Income Certificate', 'Smart Ration Card', 'Aadhaar Card'],
    rules: { minAge: 21, maxAge: 75, state: 'Tamil Nadu', maxIncome: 200000, residence: 'Rural' }
  },
  {
    id: 'TN-BC-006',
    name: 'Post-Matric Scholarship for BC / MBC Students',
    department: 'Backward Classes & Minorities Welfare (TN)',
    level: 'Tamil Nadu',
    summary: 'Government tuition fee waiver & maintenance grant for college study.',
    benefits: 'Full tuition fees reimbursement and monthly maintenance allowances.',
    application_url: 'https://bcmbcmw.tn.gov.in',
    requiredFields: ['age', 'state', 'occupation', 'annual_income', 'social_category', 'education'],
    requiredDocs: ['Community Certificate', 'Income Certificate', 'Bonafide Certificate', '12th Marksheet', 'Bank Passbook'],
    rules: { minAge: 17, maxAge: 30, state: 'Tamil Nadu', occupation: 'Student', maxIncome: 250000, social_category: 'OBC' }
  },
  {
    id: 'TN-AD-011',
    name: 'Chief Minister Overseas Scholarship for SC/ST Students',
    department: 'Adi Dravidar and Tribal Welfare (TN)',
    level: 'Tamil Nadu',
    summary: 'Financial funding for postgraduate masters and PhD programs abroad.',
    benefits: 'Up to ₹36 Lakh for overseas masters degree tuition and living stipend.',
    application_url: 'https://adw.tn.gov.in',
    requiredFields: ['age', 'state', 'occupation', 'annual_income', 'social_category', 'education'],
    requiredDocs: ['Community Certificate', 'Income Certificate', 'Passport', 'Undergraduate (UG) Degree', '12th Marksheet'],
    rules: { minAge: 20, maxAge: 35, state: 'Tamil Nadu', occupation: 'Student', maxIncome: 800000, social_category: 'SC' }
  },
  {
    id: 'TN-HEALTH-013',
    name: 'Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)',
    department: 'Health & Family Welfare (TN)',
    level: 'Tamil Nadu',
    summary: 'Cashless hospital coverage up to ₹5 Lakh per year for families in TN.',
    benefits: 'Cashless treatment coverage up to ₹5,00,000 per family per year.',
    application_url: 'https://cmchistn.com',
    requiredFields: ['age', 'state', 'annual_income'],
    requiredDocs: ['Smart Ration Card', 'Aadhaar Card', 'Income Certificate'],
    rules: { minAge: 0, maxAge: 100, state: 'Tamil Nadu', maxIncome: 120000 }
  },
  {
    id: 'GOI-MNRE-007',
    name: 'PM Surya Ghar: Muft Bijli Yojana',
    department: 'Ministry of New & Renewable Energy (Central)',
    level: 'Central',
    summary: 'Rooftop solar subsidy providing up to 300 units free monthly electricity for homes.',
    benefits: 'Direct financial subsidy of ₹30,000 to ₹78,000 credited to home owner bank account.',
    application_url: 'https://pmsuryaghar.gov.in',
    requiredFields: ['age', 'state', 'annual_income', 'employment'],
    requiredDocs: ['Electricity Bill', 'Aadhaar Card', 'Bank Passbook'],
    rules: { minAge: 18, maxAge: 80, state: 'All', maxIncome: 1500000 }
  },
  {
    id: 'GOI-MSME-008',
    name: 'PM Vishwakarma Scheme',
    department: 'Ministry of MSME (Central)',
    level: 'Central',
    summary: 'Collateral-free subsidized credit & toolkit grants for traditional artisans & craftspeople.',
    benefits: '₹15,000 e-voucher toolkit grant and collateral-free enterprise loan up to ₹3 Lakh at 5%.',
    application_url: 'https://pmvishwakarma.gov.in',
    requiredFields: ['age', 'state', 'occupation', 'annual_income'],
    requiredDocs: ['Aadhaar Card', 'Bank Passbook', 'Smart Ration Card'],
    rules: { minAge: 18, maxAge: 60, occupation: 'Daily Wage / Artisan', maxIncome: 400000 }
  },
  {
    id: 'GOI-HFW-009',
    name: 'Ayushman Bharat - PM-JAY',
    department: 'Ministry of Health & Family Welfare (Central)',
    level: 'Central',
    summary: '₹5 Lakh annual secondary & tertiary health insurance coverage.',
    benefits: 'Cashless hospitalization coverage up to ₹5,00,000 per family per year.',
    application_url: 'https://pmjay.gov.in',
    requiredFields: ['age', 'state', 'annual_income'],
    requiredDocs: ['Smart Ration Card', 'Aadhaar Card', 'BPL Certificate'],
    rules: { minAge: 0, maxAge: 100, state: 'All', maxIncome: 250000 }
  },
  {
    id: 'GOI-AGRI-010',
    name: 'PM Kisan Samman Nidhi',
    department: 'Ministry of Agriculture & Farmers Welfare (Central)',
    level: 'Central',
    summary: '₹6,000 annual income support for landholding farming families.',
    benefits: '₹6,000 per year directly credited to farmer bank account in 3 installments.',
    application_url: 'https://pmkisan.gov.in',
    requiredFields: ['age', 'state', 'occupation', 'annual_income'],
    requiredDocs: ['Land Ownership Document', 'Aadhaar Card', 'Bank Passbook'],
    rules: { minAge: 18, maxAge: 85, occupation: 'Farmer', maxIncome: 500000 }
  },
  {
    id: 'GOI-DIS-012',
    name: 'National Scholarship for Students with Disabilities',
    department: 'Ministry of Social Justice & Empowerment (Central)',
    level: 'Central',
    summary: 'Higher education scholarship grant for differently-abled scholars.',
    benefits: 'Full tuition fee waiver plus monthly disability assistive maintenance grant.',
    application_url: 'https://scholarships.gov.in',
    requiredFields: ['age', 'state', 'occupation', 'annual_income', 'disability'],
    requiredDocs: ['UDID Card', 'Bonafide Certificate', 'Income Certificate', 'Bank Passbook'],
    rules: { minAge: 16, maxAge: 40, occupation: 'Student', maxIncome: 300000, disability: 'Yes' }
  },
  {
    id: 'GOI-PMEGP-015',
    name: 'Prime Minister Employment Generation Programme (PMEGP)',
    department: 'Ministry of MSME (Central)',
    level: 'Central',
    summary: 'Credit-linked subsidy scheme for setting up new micro-enterprises.',
    benefits: 'Subsidies up to 35% on project costs up to ₹50 Lakh for manufacturing.',
    application_url: 'https://kviconline.gov.in',
    requiredFields: ['age', 'state', 'annual_income', 'employment', 'education'],
    requiredDocs: ['Aadhaar Card', '10th Marksheet', 'Bank Passbook', 'Project Report'],
    rules: { minAge: 18, maxAge: 65, state: 'All' }
  },
  {
    id: 'GOI-MUDRA-016',
    name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    department: 'Ministry of Finance (Central)',
    level: 'Central',
    summary: 'Collateral-free business loans up to ₹10 Lakh for non-corporate micro units.',
    benefits: 'Loans up to ₹10 Lakh divided into Shishu, Kishor, and Tarun categories.',
    application_url: 'https://mudra.org.in',
    requiredFields: ['age', 'state', 'occupation'],
    requiredDocs: ['Aadhaar Card', 'PAN Card', 'Bank Passbook', 'Udyam Certificate'],
    rules: { minAge: 18, maxAge: 65, state: 'All' }
  }
];

// ---------------------------------------------------------------------------
// GLOBAL STATE
// ---------------------------------------------------------------------------

const state = {
  user: null,
  profile: null,
  verifiedDocs: [],
  schemeCatalog: [],
  selectedSchemeId: null,
  selectedDistrict: '',
  selectedTaluk: '',
  taluksData: {},
  evaluatedSchemes: [],
  showEligibleOnlyMode: false
};

// ---------------------------------------------------------------------------
// UTILITY & AUTH HELPERS
// ---------------------------------------------------------------------------

function toArray(val) {
  return Array.isArray(val) ? val : [];
}

function getCachedSessionUser() {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const rawSession = localStorage.getItem(key);
      if (!rawSession) continue;
      const parsedSession = JSON.parse(rawSession);
      if (parsedSession?.user) {
        return parsedSession.user;
      }
    }
  } catch (error) {
    console.warn('[UNIORA Readiness] Cached session read warning:', error);
  }
  return null;
}

function decryptData(b64) {
  try {
    let text = atob(b64);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return JSON.parse(decodeURIComponent(result));
  } catch (error) {
    return [];
  }
}

function getStoredDocs() {
  try {
    const raw = localStorage.getItem('uniora_verified_docs');
    return raw ? decryptData(raw) : [];
  } catch (error) {
    return [];
  }
}

function buildInitialProfile() {
  const fallback = {
    age: '',
    gender: '',
    state: 'Tamil Nadu',
    district: 'Chennai',
    residence: 'Urban',
    occupation: 'Student',
    annual_income: '',
    incomeNumeric: null,
    social_category: '',
    marital_status: '',
    disability: 'No',
    education: '',
    employment: '',
    special: 'None',
    date_of_birth: ''
  };

  try {
    const raw = sessionStorage.getItem('uniora_guest_demographic_profile') || localStorage.getItem('uniora_cached_profile');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch (error) {
    return fallback;
  }
}

function saveProfileToSession(profile) {
  try {
    const str = JSON.stringify(profile);
    sessionStorage.setItem('uniora_guest_demographic_profile', str);
    localStorage.setItem('uniora_cached_profile', str);
  } catch (error) {
    console.warn('[UNIORA Readiness] Unable to save profile to storage:', error);
  }
}

function parseIncomeValue(val) {
  if (val === null || val === undefined || val === '') return null;
  const cleaned = String(val).replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function normalizeProfile(profile) {
  const base = buildInitialProfile();
  const merged = { ...base, ...(profile || {}) };

  if (!merged.age && merged.date_of_birth) {
    const dob = new Date(merged.date_of_birth);
    if (!isNaN(dob.getTime())) {
      const diff = Date.now() - dob.getTime();
      merged.age = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }
  }

  if (merged.annual_income && !merged.incomeNumeric) {
    merged.incomeNumeric = parseIncomeValue(merged.annual_income);
  }

  return merged;
}

function getLabelForField(field) {
  const labels = {
    age: 'Age (Years)',
    gender: 'Gender',
    state: 'State of Residence',
    district: 'District',
    occupation: 'Occupation Status',
    annual_income: 'Annual Household Income (₹)',
    education: 'Education Qualification',
    employment: 'Employment Status',
    social_category: 'Social Category / Caste',
    residence: 'Residence Type',
    disability: 'Disability Status',
    marital_status: 'Marital Status'
  };
  return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getFieldValue(profile, field) {
  if (!profile) return '';
  if (field === 'age') return profile.age ?? '';
  if (field === 'annual_income') return profile.annual_income ?? profile.incomeNumeric ?? '';
  return profile[field] ?? '';
}

function hasFilledValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim() !== '';
  return true;
}

function isDocVerified(requiredName, verifiedDocsList) {
  const req = String(requiredName || '').toLowerCase().trim();
  for (const doc of verifiedDocsList) {
    const docType = String(doc.document_type || doc.name || doc.document_name || '').toLowerCase().trim();
    if (req === docType || req.includes(docType) || docType.includes(req)) return true;
    if (req.includes('bonafide') && docType.includes('bonafide')) return true;
    if (req.includes('passbook') && docType.includes('passbook')) return true;
    if (req.includes('marksheet') && (docType.includes('marksheet') || docType.includes('degree') || docType.includes('diploma'))) return true;
    if (req.includes('income') && docType.includes('income')) return true;
    if (req.includes('community') && docType.includes('community')) return true;
    if ((req.includes('aadhaar') || req.includes('identity')) && (docType.includes('aadhaar') || docType.includes('voter') || docType.includes('pan') || docType.includes('passport'))) return true;
    if (req.includes('ration') && docType.includes('ration')) return true;
    if (req.includes('electricity') && docType.includes('electricity')) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// DATA FETCHING & SCHEME EVALUATION
// ---------------------------------------------------------------------------

async function fetchSchemeCatalog() {
  try {
    const response = await fetch('http://localhost:8000/api/schemes?limit=100');
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    const rawList = toArray(data?.schemes);
    if (!rawList.length || rawList.length < 5) throw new Error('Short scheme list');

    state.schemeCatalog = rawList.map(s => ({
      id: s.scheme_id || s.id || s.scheme_name,
      name: s.scheme_name || s.name,
      department: s.issuing_department || 'Government Department',
      level: s.level || s.eligibility_state || 'Central',
      summary: s.sub_title || s.description,
      benefits: s.benefits || 'Government welfare support and financial assistance.',
      application_url: s.application_url || 'https://www.tn.gov.in',
      requiredFields: ['age', 'gender', 'state', 'annual_income', 'social_category', 'occupation', 'education'].filter(f => {
        if (f === 'age' && (s.min_age || s.max_age)) return true;
        if (f === 'gender' && s.gender && s.gender !== 'All') return true;
        if (f === 'state' && s.eligibility_state && s.eligibility_state !== 'All') return true;
        if (f === 'annual_income' && s.income_limit_annual) return true;
        if (f === 'social_category' && s.social_category && s.social_category !== 'All') return true;
        if (f === 'occupation' && s.occupation_criteria && s.occupation_criteria !== 'All') return true;
        return false;
      }),
      requiredDocs: toArray(s.required_documents),
      rules: {
        minAge: s.min_age,
        maxAge: s.max_age,
        gender: s.gender,
        state: s.eligibility_state,
        maxIncome: s.income_limit_annual,
        occupation: s.occupation_criteria,
        social_category: s.social_category
      }
    }));
  } catch (error) {
    console.warn('[UNIORA Readiness] Using comprehensive fallback scheme catalog (15+ schemes):', error);
    state.schemeCatalog = FALLBACK_SCHEMES;
  }
}

function evaluateSchemeReadiness(scheme) {
  const profile = state.profile || {};
  const verifiedList = state.verifiedDocs || [];

  const requiredFields = scheme.requiredFields && scheme.requiredFields.length > 0 
    ? scheme.requiredFields 
    : ['age', 'gender', 'state', 'annual_income', 'occupation'];
  const requiredDocs = toArray(scheme.requiredDocs).length > 0
    ? toArray(scheme.requiredDocs)
    : ['Aadhaar Card'];

  // Check demographic fields
  const missingFields = [];
  const filledFields = [];
  requiredFields.forEach(field => {
    if (hasFilledValue(getFieldValue(profile, field))) {
      filledFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  // Evaluate Demographic Rules Match
  let isDemographicEligible = true;
  const rules = scheme.rules || {};
  const userAge = Number(getFieldValue(profile, 'age')) || null;
  const userGender = String(getFieldValue(profile, 'gender') || '').toLowerCase();
  const userState = String(getFieldValue(profile, 'state') || '').toLowerCase();
  const userIncome = parseIncomeValue(getFieldValue(profile, 'annual_income')) ?? profile.incomeNumeric;
  const userOccupation = String(getFieldValue(profile, 'occupation') || '').toLowerCase();
  const userCategory = String(getFieldValue(profile, 'social_category') || '').toLowerCase();

  // If user demographic value is filled and breaks rule, set ineligible; if empty, keep as potential match so user can fill it
  if (rules.minAge && userAge !== null && userAge < rules.minAge) isDemographicEligible = false;
  if (rules.maxAge && userAge !== null && userAge > rules.maxAge) isDemographicEligible = false;
  if (rules.gender && rules.gender.toLowerCase() !== 'all' && userGender && rules.gender.toLowerCase() !== userGender) isDemographicEligible = false;
  if (rules.state && rules.state.toLowerCase() !== 'all' && userState && !userState.includes(rules.state.toLowerCase()) && !rules.state.toLowerCase().includes(userState)) isDemographicEligible = false;
  if (rules.maxIncome && userIncome !== null && userIncome > rules.maxIncome) isDemographicEligible = false;
  if (rules.occupation && rules.occupation.toLowerCase() !== 'all' && userOccupation && !userOccupation.includes(rules.occupation.toLowerCase()) && !rules.occupation.toLowerCase().includes(userOccupation)) isDemographicEligible = false;
  if (rules.social_category && rules.social_category.toLowerCase() !== 'all' && userCategory && rules.social_category.toLowerCase() !== userCategory && !userCategory.includes(rules.social_category.toLowerCase())) isDemographicEligible = false;

  // Check documents
  const verifiedMatchedDocs = [];
  const missingDocs = [];
  requiredDocs.forEach(doc => {
    if (isDocVerified(doc, verifiedList)) {
      verifiedMatchedDocs.push(doc);
    } else {
      missingDocs.push(doc);
    }
  });

  const totalItems = requiredFields.length + requiredDocs.length;
  const completedItems = filledFields.length + verifiedMatchedDocs.length;
  const readinessScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const is100PercentReady = missingFields.length === 0 && missingDocs.length === 0;

  return {
    ...scheme,
    requiredFields,
    requiredDocs,
    missingFields,
    filledFields,
    verifiedMatchedDocs,
    missingDocs,
    readinessScore,
    is100PercentReady,
    isDemographicEligible,
    totalItems,
    completedItems
  };
}

// ---------------------------------------------------------------------------
// RENDERERS
// ---------------------------------------------------------------------------

function setupToggleFilterButtons() {
  const eligibleOnlyBtn = document.getElementById('toggleEligibleOnlyBtn');
  const allSchemesBtn = document.getElementById('toggleAllSchemesBtn');

  if (eligibleOnlyBtn && allSchemesBtn) {
    const syncToggleState = () => {
      eligibleOnlyBtn.classList.toggle('active', state.showEligibleOnlyMode);
      allSchemesBtn.classList.toggle('active', !state.showEligibleOnlyMode);
    };

    syncToggleState();

    eligibleOnlyBtn.onclick = () => {
      state.showEligibleOnlyMode = true;
      syncToggleState();
      renderSchemeSelector();
      renderAllReadinessPanels();
    };

    allSchemesBtn.onclick = () => {
      state.showEligibleOnlyMode = false;
      syncToggleState();
      renderSchemeSelector();
      renderAllReadinessPanels();
    };
  }
}

function renderSchemeSelector() {
  const selector = document.getElementById('schemeSelector');
  const selectorLabel = document.getElementById('selectorLabel');
  if (!selector) return;

  const evaluatedList = state.schemeCatalog.map(evaluateSchemeReadiness);
  state.evaluatedSchemes = evaluatedList;

  // Filter ONLY ELIGIBLE schemes if showEligibleOnlyMode is true
  const displayList = state.showEligibleOnlyMode
    ? evaluatedList.filter(s => s.isDemographicEligible || s.readinessScore > 0)
    : evaluatedList;

  if (selectorLabel) {
    selectorLabel.textContent = state.showEligibleOnlyMode
      ? `Showing Eligible Schemes (${displayList.length} matched out of ${evaluatedList.length} total catalog schemes)`
      : `Showing All Catalog Schemes (${displayList.length} total schemes)`;
  }

  // Preselect from URL parameter if present
  const urlParams = new URLSearchParams(window.location.search);
  const paramScheme = urlParams.get('scheme');

  if (paramScheme) {
    const matched = evaluatedList.find(s => s.id === paramScheme || s.name.toLowerCase() === paramScheme.toLowerCase());
    if (matched) {
      state.selectedSchemeId = matched.id;
    }
  }

  if (!displayList.some(s => s.id === state.selectedSchemeId) && displayList.length > 0) {
    state.selectedSchemeId = displayList[0].id;
  }

  if (displayList.length === 0) {
    selector.innerHTML = `<option value="">No eligible schemes match your current demographic profile inputs</option>`;
    return;
  }

  selector.innerHTML = displayList.map(s => `
    <option value="${s.id}" ${s.id === state.selectedSchemeId ? 'selected' : ''}>
      ${s.name} (${s.readinessScore}% ready)
    </option>
  `).join('');

  selector.onchange = (e) => {
    state.selectedSchemeId = e.target.value;
    renderAllReadinessPanels();
  };
}

function renderSchemeMetadata(selectedScheme) {
  const metaEl = document.getElementById('schemeMeta');
  const badgeEl = document.getElementById('schemeBadge');
  if (!metaEl || !selectedScheme) return;

  const readinessColor = selectedScheme.readinessScore >= 80 ? '#16a34a' : (selectedScheme.readinessScore >= 50 ? '#f59e0b' : '#dc2626');
  if (badgeEl) {
    badgeEl.textContent = selectedScheme.is100PercentReady ? '100% Ready' : `${selectedScheme.readinessScore}% Ready`;
    badgeEl.style.background = selectedScheme.is100PercentReady ? '#dcfce7' : '#fff7ed';
    badgeEl.style.color = readinessColor;
  }

  metaEl.innerHTML = `
    <div class="meta-header">
      <h4 class="meta-title">${selectedScheme.name}</h4>
      <span class="meta-level-tag">${selectedScheme.level || 'Tamil Nadu'}</span>
    </div>
    <p class="meta-dept">🏛️ ${selectedScheme.department}</p>
    <p class="meta-summary">${selectedScheme.summary}</p>
    <div class="meta-benefits">
      <strong>🎁 Benefits:</strong> ${selectedScheme.benefits || 'Welfare support assistance'}
    </div>
    <div class="meta-docs-overview">
      <strong>📄 Required Documents (${selectedScheme.requiredDocs.length}):</strong>
      <span>${selectedScheme.requiredDocs.join(', ')}</span>
    </div>
  `;
}

function renderReadinessGauge(selectedScheme) {
  const ring = document.getElementById('scoreRing');
  const value = document.getElementById('scoreValue');
  const status = document.getElementById('scoreStatus');
  if (!ring || !value || !status || !selectedScheme) return;

  const score = Math.max(0, Math.min(100, selectedScheme.readinessScore || 0));
  const color = score >= 80 ? '#16a34a' : (score >= 50 ? '#f59e0b' : '#dc2626');
  const angle = (score / 100) * 360;

  ring.style.background = `conic-gradient(${color} ${angle}deg, #e2e8f0 0deg 360deg)`;
  value.textContent = `${score}%`;

  if (selectedScheme.is100PercentReady) {
    status.innerHTML = `<span style="color:#16a34a; font-weight:700;">🎉 100% Ready to Apply!</span>`;
  } else if (selectedScheme.missingDocs.length > 0 && selectedScheme.missingFields.length > 0) {
    status.innerHTML = `Missing <strong>${selectedScheme.missingFields.length} details</strong> and <strong>${selectedScheme.missingDocs.length} documents</strong>`;
  } else if (selectedScheme.missingDocs.length > 0) {
    status.innerHTML = `Missing <strong>${selectedScheme.missingDocs.length} documents</strong> to verify`;
  } else {
    status.innerHTML = `Fill <strong>${selectedScheme.missingFields.length} profile details</strong> below`;
  }
}

function renderMissingFieldsForm(selectedScheme) {
  const listEl = document.getElementById('missingDetailsList');
  const badgeEl = document.getElementById('detailCountBadge');
  const formEl = document.getElementById('detailFillForm');
  if (!listEl || !badgeEl || !formEl || !selectedScheme) return;

  const missing = selectedScheme.missingFields || [];
  badgeEl.textContent = `${missing.length} missing`;
  badgeEl.className = missing.length > 0 ? 'mini-badge warning' : 'mini-badge success';

  if (missing.length === 0) {
    listEl.innerHTML = `
      <div class="success-box">
        <span class="success-icon">✓</span>
        <div>
          <strong>All Demographic Details Complete!</strong>
          <p>Every profile detail required for ${selectedScheme.name} has been provided.</p>
        </div>
      </div>
    `;
    formEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = missing.map(field => `
    <div class="check-row missing">
      <div class="check-label">
        <span class="check-dot">!</span>
        <span>${getLabelForField(field)}</span>
      </div>
      <small class="text-danger">Action required</small>
    </div>
  `).join('');

  // Render input controls for missing fields
  const fieldOptions = {
    gender: ['Male', 'Female', 'Transgender', 'Other'],
    state: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Other'],
    occupation: ['Student', 'Daily Wage / Artisan', 'Farmer', 'Private Job', 'Government Job', 'Self-employed', 'Unemployed'],
    education: ['School', 'Diploma', 'Undergraduate', 'Postgraduate', 'Other'],
    employment: ['Employed', 'Unemployed', 'Self-employed', 'Student'],
    social_category: ['General', 'OBC', 'BC', 'MBC/DNC', 'SC', 'ST', 'Other'],
    residence: ['Urban', 'Rural'],
    disability: ['No', 'Yes']
  };

  const inputsHtml = missing.map(field => {
    const label = getLabelForField(field);
    const val = getFieldValue(state.profile, field);
    const opts = fieldOptions[field];

    if (opts) {
      return `
        <div class="form-field">
          <label for="fill-${field}">${label}</label>
          <select id="fill-${field}" data-field="${field}" required class="form-select">
            <option value="">Select ${label}</option>
            ${opts.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      `;
    }

    const type = ['age', 'annual_income'].includes(field) ? 'number' : 'text';
    return `
      <div class="form-field">
        <label for="fill-${field}">${label}</label>
        <input type="${type}" id="fill-${field}" data-field="${field}" value="${val}" placeholder="Enter ${label.toLowerCase()}" required class="form-input" />
      </div>
    `;
  }).join('');

  formEl.innerHTML = `
    ${inputsHtml}
    <button type="submit" id="saveProfileBtn" class="primary-btn wide">Save & Update Profile Details</button>
  `;

  formEl.onsubmit = async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Saving details...';
    }

    const updatedProfile = { ...state.profile };
    const inputs = formEl.querySelectorAll('[data-field]');
    
    inputs.forEach(input => {
      const field = input.dataset.field;
      let val = input.value;
      if (input.type === 'number') val = val === '' ? '' : Number(val);
      if (field === 'annual_income') {
        updatedProfile.annual_income = val;
        updatedProfile.incomeNumeric = parseIncomeValue(val);
      } else {
        updatedProfile[field] = val;
      }
    });

    state.profile = normalizeProfile(updatedProfile);
    saveProfileToSession(state.profile);

    // ONLY for logged in users: Sync to Supabase user_info table
    if (state.user && supabase) {
      try {
        const payload = {
          uid: state.user.id,
          email: state.user.email || '',
          gender: state.profile.gender || '',
          state: state.profile.state || '',
          district: state.profile.district || '',
          residence_type: state.profile.residence || 'Urban',
          occupation: state.profile.occupation || '',
          annual_family_income: state.profile.incomeNumeric || parseIncomeValue(state.profile.annual_income) || 0,
          social_category: state.profile.social_category || '',
          education_level: state.profile.education || '',
          employment_status: state.profile.employment || '',
          marital_status: state.profile.marital_status || '',
          disability_status: state.profile.disability || 'No',
          special_beneficiary_status: state.profile.special || 'None',
          date_of_birth: state.profile.date_of_birth || '',
          updated_at: new Date().toISOString()
        };
        await supabase.from('user_info').upsert(payload, { onConflict: 'uid' });

        // Save readiness summary for logged in user to user_readiness table
        await syncUserReadinessToDatabase();
      } catch (err) {
        console.warn('[UNIORA Readiness] Supabase profile sync notice:', err);
      }
    }

    // Re-evaluate and re-render all panels
    renderAllReadinessPanels();
  };
}

function renderRequiredDocumentsChecklist(selectedScheme) {
  const listEl = document.getElementById('requiredDocumentsList');
  const badgeEl = document.getElementById('documentCountBadge');
  const verifyBtn = document.getElementById('verifyDocumentsBtn');
  if (!listEl || !badgeEl || !selectedScheme) return;

  const missingDocs = selectedScheme.missingDocs || [];
  badgeEl.textContent = `${missingDocs.length} missing`;
  badgeEl.className = missingDocs.length > 0 ? 'mini-badge warning' : 'mini-badge success';

  listEl.innerHTML = selectedScheme.requiredDocs.map(docName => {
    const isMissing = missingDocs.includes(docName);
    const returnUrl = `../../../features/03_documents_verification/frontend/index.html?doc=${encodeURIComponent(docName)}&return=readiness&scheme=${encodeURIComponent(selectedScheme.id)}`;

    return `
      <div class="check-row ${isMissing ? 'missing' : 'ok'}">
        <div class="check-label">
          <span class="check-dot">${isMissing ? '!' : '✓'}</span>
          <div>
            <strong>${docName}</strong>
            <small style="display:block; color:#64748b;">${isMissing ? 'Required for verification' : 'Verified & on file'}</small>
          </div>
        </div>
        <div>
          ${isMissing 
            ? `<a href="${returnUrl}" class="verify-btn-link">Verify ${docName} →</a>`
            : `<span class="verified-pill-tag">✓ Verified</span>`
          }
        </div>
      </div>
    `;
  }).join('');

  if (verifyBtn) {
    if (missingDocs.length > 0) {
      const firstMissing = missingDocs[0];
      verifyBtn.style.display = 'block';
      verifyBtn.onclick = () => {
        window.location.href = `../../../features/03_documents_verification/frontend/index.html?doc=${encodeURIComponent(firstMissing)}&return=readiness&scheme=${encodeURIComponent(selectedScheme.id)}`;
      };
    } else {
      verifyBtn.style.display = 'none';
    }
  }
}

function renderNextStepsActionFlow(selectedScheme) {
  const container = document.getElementById('nextStepsContent');
  if (!container || !selectedScheme) return;

  if (selectedScheme.is100PercentReady) {
    container.innerHTML = `
      <div class="ready-banner-box">
        <div class="banner-badge">🎉 100% READINESS ACHIEVED</div>
        <h3>You are completely ready to apply for ${selectedScheme.name}!</h3>
        <p>All demographic criteria match and all required documents are verified.</p>
        <div class="action-buttons-group">
          <a href="${selectedScheme.application_url || '#'}" target="_blank" rel="noopener noreferrer" class="primary-btn wide apply-now-btn">
            Proceed to Official Application Portal ↗
          </a>
          <button type="button" id="scrollToCorrectionBtn" class="ghost-btn">
            Need Document Correction or Service Help?
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="action-needed-box">
        <div class="banner-badge warning">ACTION NEEDED BEFORE APPLYING</div>
        <h3>Complete missing items for ${selectedScheme.name}</h3>
        <p>You have <strong>${selectedScheme.missingFields.length} missing detail(s)</strong> and <strong>${selectedScheme.missingDocs.length} missing document(s)</strong>.</p>
        <div class="action-buttons-group">
          ${selectedScheme.missingDocs.length > 0 ? `
            <a href="../../../features/03_documents_verification/frontend/index.html?doc=${encodeURIComponent(selectedScheme.missingDocs[0])}&return=readiness&scheme=${encodeURIComponent(selectedScheme.id)}" class="primary-btn">
              Verify Missing Documents Now →
            </a>
          ` : ''}
          <button type="button" id="scrollToCorrectionBtn" class="secondary-btn">
            Find Nearby Service Center for Document Errors 📍
          </button>
        </div>
      </div>
    `;
  }

  const scrollBtn = document.getElementById('scrollToCorrectionBtn');
  if (scrollBtn) {
    scrollBtn.onclick = () => {
      document.getElementById('servicesBox')?.scrollIntoView({ behavior: 'smooth' });
    };
  }
}

function renderNearbyServicesMap() {
  const districtSelect = document.getElementById('readinessDistrictSelect');
  const talukSelect = document.getElementById('readinessTalukSelect');
  const mapFrame = document.getElementById('serviceMapFrame');
  const locationLabel = document.getElementById('mapLocationLabel');
  const locationBadge = document.getElementById('mapActiveLocationBadge');
  const serviceCardsContainer = document.getElementById('serviceCards');

  if (!districtSelect || !talukSelect) return;

  const districts = Object.keys(state.taluksData).sort((a, b) => a.localeCompare(b));

  if (districtSelect.options.length <= 1) {
    districtSelect.innerHTML = '<option value="">Select District</option>' + districts.map(d => `
      <option value="${d}">${d}</option>
    `).join('');
  }

  // Preselect user's district or default to Chennai
  const activeDistrict = state.selectedDistrict || state.profile?.district || 'Chennai';
  if (districts.includes(activeDistrict)) {
    districtSelect.value = activeDistrict;
    state.selectedDistrict = activeDistrict;
    populateTalukSelect(activeDistrict);
  }

  districtSelect.onchange = (e) => {
    const dist = e.target.value;
    state.selectedDistrict = dist;
    state.selectedTaluk = '';
    populateTalukSelect(dist);
    updateMapAndOfficeCards();
  };

  talukSelect.onchange = (e) => {
    state.selectedTaluk = e.target.value;
    updateMapAndOfficeCards();
  };

  updateMapAndOfficeCards();
}

function populateTalukSelect(district) {
  const talukSelect = document.getElementById('readinessTalukSelect');
  if (!talukSelect) return;

  const taluks = state.taluksData[district] || [];
  if (!taluks.length) {
    talukSelect.innerHTML = '<option value="">No taluks available</option>';
    talukSelect.disabled = true;
    return;
  }

  talukSelect.disabled = false;
  talukSelect.innerHTML = '<option value="">Select Taluk</option>' + taluks.map(t => `
    <option value="${t}">${t}</option>
  `).join('');

  if (!state.selectedTaluk && taluks.length > 0) {
    state.selectedTaluk = taluks[0];
    talukSelect.value = taluks[0];
  }
}

function updateMapAndOfficeCards() {
  const mapFrame = document.getElementById('serviceMapFrame');
  const locationLabel = document.getElementById('mapLocationLabel');
  const locationBadge = document.getElementById('mapActiveLocationBadge');
  const cardsContainer = document.getElementById('serviceCards');

  const district = state.selectedDistrict || state.profile?.district || 'Chennai';
  const taluk = state.selectedTaluk || district;

  if (locationLabel) locationLabel.textContent = `Nearby Government Service Centers in ${taluk}, ${district}`;
  if (locationBadge) locationBadge.textContent = `${district}`;

  if (mapFrame) {
    const queryStr = encodeURIComponent(`Arasu e-Sevai Centre ${taluk} ${district} Tamil Nadu`);
    mapFrame.src = `https://maps.google.com/maps?q=${queryStr}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  }

  if (cardsContainer) {
    const offices = [
      { name: 'District Collectorate', icon: '🏛️', color: '#2563eb', summary: `District administration, grievances & correction support for ${district}.`, query: `District Collectorate ${district} Tamil Nadu` },
      { name: 'Taluk Office', icon: '📜', color: '#059669', summary: `Revenue, nativity & income certificate correction desk for ${taluk}.`, query: `Taluk Office ${taluk} ${district} Tamil Nadu` },
      { name: 'Arasu e-Sevai Centre', icon: '💻', color: '#7c3aed', summary: `Citizen service desk for document verification & error correction.`, query: `Arasu e-Sevai Centre ${taluk} ${district} Tamil Nadu` },
      { name: 'Social Welfare Office', icon: '🤝', color: '#db2777', summary: `Welfare scheme guidance & document mismatch correction desk.`, query: `Social Welfare Office ${district} Tamil Nadu` }
    ];

    cardsContainer.innerHTML = offices.map(off => `
      <div class="service-card">
        <div class="service-header">
          <div class="service-icon">${off.icon}</div>
          <div class="service-name">${off.name}</div>
        </div>
        <p class="service-summary">${off.summary}</p>
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(off.query)}" target="_blank" rel="noopener noreferrer" class="service-link">
          Open in Maps ↗
        </a>
      </div>
    `).join('');
  }
}

function updateSummaryPills() {
  const eligibleEl = document.getElementById('eligibleCount');
  const bestEl = document.getElementById('bestReadiness');
  const verifiedDocsEl = document.getElementById('verifiedDocsCount');

  const evaluated = state.evaluatedSchemes || [];
  const eligibleCount = evaluated.filter(s => s.isDemographicEligible || s.readinessScore >= 50).length;
  const selectedScheme = evaluated.find(s => s.id === state.selectedSchemeId);
  const selectedScore = selectedScheme ? selectedScheme.readinessScore : (evaluated.length > 0 ? evaluated[0].readinessScore : 0);

  if (eligibleEl) eligibleEl.textContent = String(eligibleCount);
  if (bestEl) bestEl.textContent = `${selectedScore}%`;
  if (verifiedDocsEl) verifiedDocsEl.textContent = String(state.verifiedDocs.length);
}

async function syncUserReadinessToDatabase() {
  if (!state.user || !supabase) return;
  try {
    const selectedScheme = state.evaluatedSchemes.find(s => s.id === state.selectedSchemeId);
    const payload = {
      uid: state.user.id,
      selected_scheme_id: state.selectedSchemeId || '',
      readiness_score: selectedScheme ? selectedScheme.readinessScore : 0,
      eligible_schemes_count: state.evaluatedSchemes.filter(s => s.isDemographicEligible).length,
      readiness_data: {
        selected_scheme_name: selectedScheme ? selectedScheme.name : '',
        missing_fields: selectedScheme ? selectedScheme.missingFields : [],
        missing_docs: selectedScheme ? selectedScheme.missingDocs : [],
        verified_docs_count: state.verifiedDocs.length,
        updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };
    await supabase.from('user_readiness').upsert(payload, { onConflict: 'uid' });
  } catch (err) {
    console.warn('[UNIORA Readiness] Sync user_readiness notice:', err);
  }
}

function renderAllReadinessPanels() {
  // Re-evaluate schemes using current state.profile & state.verifiedDocs
  state.evaluatedSchemes = state.schemeCatalog.map(evaluateSchemeReadiness);

  const displayList = state.showEligibleOnlyMode
    ? state.evaluatedSchemes.filter(s => s.isDemographicEligible || s.readinessScore > 0)
    : state.evaluatedSchemes;

  const selectedScheme = displayList.find(s => s.id === state.selectedSchemeId) || displayList[0] || state.evaluatedSchemes[0];
  if (!selectedScheme) return;

  renderSchemeSelector();
  renderSchemeMetadata(selectedScheme);
  renderReadinessGauge(selectedScheme);
  renderMissingFieldsForm(selectedScheme);
  renderRequiredDocumentsChecklist(selectedScheme);
  renderNextStepsActionFlow(selectedScheme);
  updateSummaryPills();

  // If logged in, sync readiness score to DB in background
  if (state.user && supabase) {
    void syncUserReadinessToDatabase();
  }
}

// ---------------------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------------------

async function loadTaluksData() {
  try {
    const res = await fetch('../../../common/data/taluks.json');
    if (!res.ok) throw new Error('Could not load taluks.json');
    state.taluksData = await res.json();
  } catch (err) {
    console.warn('[UNIORA Readiness] Taluk data load warning:', err);
    state.taluksData = { 'Chennai': ['Egmore-Nungambakkam', 'Mambalam-Guindy'] };
  }
}

async function initReadinessApp() {
  initActiveNavLink();
  initNavbarMenu();
  try {
    await initNavbarAuth();
  } catch (e) {
    console.warn('[UNIORA Readiness] navbar auth notice:', e);
  }

  setupToggleFilterButtons();

  // Determine logged-in user with robust fallback to session cache
  let currentUser = await getCurrentUser();
  if (!currentUser) {
    const session = await getCurrentSession();
    if (session && session.user) {
      currentUser = session.user;
    } else {
      currentUser = getCachedSessionUser();
    }
  }
  state.user = currentUser;

  const badgeEl = document.getElementById('userStateBadge');
  if (badgeEl) {
    if (currentUser) {
      const displayName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User';
      badgeEl.textContent = `Logged in (${displayName})`;
      badgeEl.style.background = '#dcfce7';
      badgeEl.style.color = '#15803d';
    } else {
      badgeEl.textContent = 'Guest mode (No Database Sync)';
      badgeEl.style.background = '#ecfeff';
      badgeEl.style.color = '#0f766e';
    }
  }

  // 1. Fetch user profile from Supabase if logged in
  if (currentUser && supabase) {
    try {
      const { data, error } = await supabase.from('user_info').select('*').eq('uid', currentUser.id).maybeSingle();
      if (!error && data) {
        state.profile = normalizeProfile({
          gender: data.gender || '',
          state: data.state || 'Tamil Nadu',
          district: data.district || '',
          occupation: data.occupation || '',
          annual_income: data.annual_family_income || data.annual_income || '',
          incomeNumeric: data.annual_family_income || null,
          social_category: data.social_category || '',
          education: data.education_level || data.education || '',
          employment: data.employment_status || data.employment || '',
          residence: data.residence_type || data.residence || 'Urban',
          disability: data.disability_status || data.disability || 'No',
          marital_status: data.marital_status || '',
          special: data.special_beneficiary_status || data.special || 'None',
          date_of_birth: data.date_of_birth || ''
        });
      }
    } catch (err) {
      console.warn('[UNIORA Readiness] Supabase profile fetch notice:', err);
    }
  }

  if (!state.profile) {
    state.profile = normalizeProfile(buildInitialProfile());
  }

  // 2. Fetch verified documents from local storage & Supabase
  state.verifiedDocs = getStoredDocs();

  if (currentUser && supabase) {
    try {
      // Direct Supabase table query for verified documents
      const { data: dbDocs, error } = await supabase.from('user_documents').select('*').eq('uid', currentUser.id);
      if (!error && Array.isArray(dbDocs)) {
        dbDocs.forEach(d => {
          const docType = d.document_type;
          const isVerified = (d.is_verified === true) || (d.verification_status === 'verified') || (d.is_verified === undefined && d.verification_status === undefined);
          if (isVerified) {
            if (!state.verifiedDocs.some(vd => (vd.document_type || vd.name || vd.document_name) === docType)) {
              state.verifiedDocs.push({ document_type: docType, data: d.extracted_data || {} });
            }
          }
        });
      }

      // Load saved user readiness state from Supabase user_readiness table if exists
      const { data: dbReadiness } = await supabase.from('user_readiness').select('*').eq('uid', currentUser.id).maybeSingle();
      if (dbReadiness && dbReadiness.selected_scheme_id) {
        state.selectedSchemeId = dbReadiness.selected_scheme_id;
      }
    } catch (e) {
      console.warn('[UNIORA Readiness] DB docs/readiness fetch notice:', e);
    }
  }

  await loadTaluksData();
  await fetchSchemeCatalog();

  renderSchemeSelector();
  renderAllReadinessPanels();
  renderNearbyServicesMap();
}

// Subscribe to auth state changes for live re-rendering on login/logout
if (onAuthStateChange) {
  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      initReadinessApp();
    }
  });
}

// Real-time listener for document upload/verification updates from other windows/tabs or back navigation
window.addEventListener('storage', () => {
  state.verifiedDocs = getStoredDocs();
  renderAllReadinessPanels();
});

window.addEventListener('focus', () => {
  state.verifiedDocs = getStoredDocs();
  renderAllReadinessPanels();
});

document.addEventListener('DOMContentLoaded', initReadinessApp);
