import { supabase } from '../../../common/js/supabase.js';
import { getCurrentUser, getCurrentSession } from '../../../common/js/auth.js';
import { initNavbarAuth, initActiveNavLink, initNavbarMenu } from '../../../common/js/navbar.js';

const SECRET_KEY = 'uniora_secure_2024';

const SCHEMES = [
  {
    id: 'TAMIL_PUDHALVAN',
    name: 'Tamil Pudhalvan Scheme',
    department: 'Higher Education Department, Tamil Nadu',
    summary: 'Higher education assistance for male students pursuing undergraduate study.',
    requiredFields: ['age', 'gender', 'state', 'occupation', 'annual_income', 'education'],
    requiredDocs: ['Aadhaar Card', 'Bonafide Certificate', 'Bank Passbook', '12th Marksheet'],
    rules: { minAge: 17, maxAge: 25, gender: 'Male', state: 'Tamil Nadu', occupation: 'Student', maxIncome: 300000 }
  },
  {
    id: 'PUDHUMAI_PENN',
    name: 'Pudhumai Penn Scheme',
    department: 'Social Welfare & Women Rights, Tamil Nadu',
    summary: 'Monthly support for eligible girl students from Tamil Nadu.',
    requiredFields: ['age', 'gender', 'state', 'occupation', 'annual_income', 'education'],
    requiredDocs: ['Aadhaar Card', 'Bonafide Certificate', 'Bank Passbook', '10th Marksheet'],
    rules: { minAge: 17, maxAge: 26, gender: 'Female', state: 'Tamil Nadu', occupation: 'Student', maxIncome: 350000 }
  },
  {
    id: 'NAAN_MUDHALVAN',
    name: 'Naan Mudhalvan Scheme',
    department: 'Skill Development Department, Tamil Nadu',
    summary: 'Industry-linked skill development for students and job seekers.',
    requiredFields: ['age', 'state', 'occupation', 'education'],
    requiredDocs: ['Aadhaar Card', 'Bonafide Certificate'],
    rules: { minAge: 17, maxAge: 29, state: 'Tamil Nadu', occupation: 'Student' }
  },
  {
    id: 'KALAIGNAR_MAGALIR',
    name: 'Kalaignar Magalir Urimai Thogai',
    department: 'Social Welfare Department, Tamil Nadu',
    summary: 'Monthly support for eligible women household heads.',
    requiredFields: ['age', 'gender', 'state', 'annual_income'],
    requiredDocs: ['Smart Ration Card', 'Aadhaar Card', 'Electricity Bill', 'Bank Passbook'],
    rules: { minAge: 21, maxAge: 65, gender: 'Female', state: 'Tamil Nadu', maxIncome: 250000 }
  },
  {
    id: 'PM_SURYA_GHAR',
    name: 'PM Surya Ghar: Muft Bijli Yojana',
    department: 'Ministry of New & Renewable Energy',
    summary: 'Solar rooftop subsidy for eligible households across India.',
    requiredFields: ['age', 'state', 'annual_income', 'employment'],
    requiredDocs: ['Electricity Bill', 'Aadhaar Card', 'Bank Passbook'],
    rules: { minAge: 18, maxAge: 80, state: 'All', maxIncome: 1500000 }
  }
];

const state = {
  user: null,
  profile: null,
  verifiedDocs: [],
  eligibleSchemes: [],
  selectedSchemeId: null,
  sessionReady: false
};

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

function readVerifiedDocs() {
  try {
    const raw = localStorage.getItem('uniora_verified_docs');
    return raw ? decryptData(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveProfileToSession(profile) {
  try {
    sessionStorage.setItem('uniora_guest_demographic_profile', JSON.stringify(profile));
  } catch (error) {
    console.warn('[UNIORA Readiness] Unable to save guest profile', error);
  }
}

function buildInitialProfile() {
  const fallback = {
    age: '',
    gender: '',
    state: '',
    district: '',
    residence: 'Urban',
    occupation: '',
    annual_income: '',
    incomeNumeric: null,
    social_category: '',
    marital_status: '',
    disability: 'No',
    education: '',
    employment: '',
    family_size: '',
    special: 'None',
    percentage: '',
    date_of_birth: ''
  };

  try {
    const raw = sessionStorage.getItem('uniora_guest_demographic_profile');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch (error) {
    return fallback;
  }
}

function normalizeProfile(profile) {
  const base = buildInitialProfile();
  const merged = { ...base, ...(profile || {}) };

  if (!merged.age && merged.date_of_birth) {
    merged.age = calculateAge(merged.date_of_birth);
  }

  if (merged.annual_income && !merged.incomeNumeric) {
    merged.incomeNumeric = parseIncomeValue(merged.annual_income);
  }

  return merged;
}

function parseIncomeValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function calculateAge(dob) {
  if (!dob) return '';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getLabelForField(field) {
  const labels = {
    age: 'Age',
    gender: 'Gender',
    state: 'State',
    district: 'District',
    occupation: 'Occupation',
    annual_income: 'Annual income',
    education: 'Education level',
    employment: 'Employment status',
    incomeRange: 'Income range',
    social_category: 'Social category',
    residence: 'Residence type'
  };
  return labels[field] || field;
}

function fieldValue(profile, field) {
  if (!profile) return '';
  if (field === 'age') return profile.age ?? '';
  if (field === 'annual_income') return profile.annual_income ?? profile.incomeRange ?? profile.incomeNumeric ?? '';
  return profile[field] ?? '';
}

function hasFilledValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function toTitleCase(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

function buildFieldOptions(field) {
  const options = {
    gender: ['Male', 'Female', 'Transgender', 'Other'],
    state: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Other'],
    occupation: ['Student', 'Daily Wage / Artisan', 'Farmer', 'Private Job', 'Government Job', 'Self-employed', 'Unemployed'],
    education: ['School', 'Diploma', 'Undergraduate', 'Postgraduate', 'Other'],
    employment: ['Employed', 'Unemployed', 'Self-employed', 'Student'],
    social_category: ['General', 'OBC', 'SC', 'ST', 'Other'],
    residence: ['Urban', 'Rural'],
    marital_status: ['Single', 'Married', 'Widowed', 'Separated'],
    disability: ['No', 'Yes']
  };

  return options[field] || [];
}

function renderSelectField(field, value) {
  const options = buildFieldOptions(field);
  const current = value || '';
  return `
    <div class="form-field">
      <label>${getLabelForField(field)}</label>
      <select data-fill-field="${field}">
        <option value="">Select ${getLabelForField(field)}</option>
        ${options.map(option => `<option value="${option}" ${current === option ? 'selected' : ''}>${option}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderInputField(field, value) {
  const inputType = ['age', 'annual_income', 'family_size'].includes(field) ? 'number' : 'text';
  return `
    <div class="form-field">
      <label>${getLabelForField(field)}</label>
      <input type="${inputType}" data-fill-field="${field}" value="${String(value || '').replace(/"/g, '&quot;')}" placeholder="Enter ${getLabelForField(field).toLowerCase()}" />
    </div>
  `;
}

function renderFieldEditor(missingFields) {
  const form = document.getElementById('detailFillForm');
  if (!form) return;

  if (!missingFields.length) {
    form.innerHTML = '<div class="empty-box">All required details are complete for this scheme.</div>';
    return;
  }

  const fieldHtml = missingFields.map(field => {
    const value = fieldValue(state.profile, field);
    if (buildFieldOptions(field).length) {
      return renderSelectField(field, value);
    }
    return renderInputField(field, value);
  }).join('');

  form.innerHTML = `${fieldHtml}<button type="submit" class="primary-btn">Save details</button>`;
}

function evaluateScheme(profile, scheme) {
  const approvedFields = [];
  const missingFields = [];

  scheme.requiredFields.forEach(field => {
    if (hasFilledValue(fieldValue(profile, field))) {
      approvedFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  const annualIncome = parseIncomeValue(fieldValue(profile, 'annual_income')) ?? profile?.incomeNumeric ?? null;
  const age = Number(fieldValue(profile, 'age')) || null;
  const gender = profile?.gender || '';
  const stateName = profile?.state || '';
  const occupation = profile?.occupation || '';
  const education = profile?.education || '';
  const employment = profile?.employment || '';

  let passesDemographic = true;
  const rules = scheme.rules || {};

  if (rules.minAge && age !== null && (age < rules.minAge || age > (rules.maxAge || 100))) passesDemographic = false;
  if (rules.gender && rules.gender !== 'All' && gender && rules.gender !== gender) passesDemographic = false;
  if (rules.state && rules.state !== 'All' && stateName && rules.state !== stateName) passesDemographic = false;
  if (rules.maxIncome && annualIncome !== null && annualIncome > rules.maxIncome) passesDemographic = false;
  if (rules.occupation && rules.occupation !== 'All' && occupation && rules.occupation !== occupation) passesDemographic = false;
  if (rules.education && rules.education !== 'All' && education && rules.education !== education) passesDemographic = false;
  if (rules.employment && rules.employment !== 'All' && employment && rules.employment !== employment) passesDemographic = false;

  const verifiedMap = new Map(state.verifiedDocs.map(item => [item.document_type, true]));
  const missingDocs = scheme.requiredDocs.filter(doc => !verifiedMap.has(doc));

  const totalChecks = scheme.requiredFields.length + scheme.requiredDocs.length;
  const completedChecks = (scheme.requiredFields.length - missingFields.length) + (scheme.requiredDocs.length - missingDocs.length);
  const readinessScore = totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;

  const eligible = passesDemographic && missingFields.length === 0 && missingDocs.length === 0;

  return {
    ...scheme,
    missingFields,
    missingDocs,
    readinessScore,
    eligible,
    passesDemographic,
    completedChecks,
    totalChecks
  };
}

function getEligibleSchemes() {
  const schemes = SCHEMES.map(scheme => evaluateScheme(state.profile, scheme));
  const sorted = schemes.sort((a, b) => b.readinessScore - a.readinessScore || Number(b.eligible) - Number(a.eligible));
  return sorted;
}

function renderSchemeOptions() {
  const selector = document.getElementById('schemeSelector');
  if (!selector) return;

  const schemes = getEligibleSchemes();
  state.eligibleSchemes = schemes;
  state.selectedSchemeId = state.selectedSchemeId || schemes[0]?.id || null;

  if (!schemes.length) {
    selector.innerHTML = '<option value="">No eligible schemes found</option>';
    return;
  }

  selector.innerHTML = schemes.map((scheme) => (
    `<option value="${scheme.id}" ${scheme.id === state.selectedSchemeId ? 'selected' : ''}>${scheme.name}</option>`
  )).join('');
}

function renderMeta(scheme) {
  const meta = document.getElementById('schemeMeta');
  if (!meta || !scheme) return;

  const label = scheme.eligible ? 'Eligible now' : (scheme.missingDocs.length || scheme.missingFields.length ? 'Needs a few fixes' : 'Not yet matching');
  meta.innerHTML = `
    <strong>${label}</strong><br>
    <span>${scheme.department}</span><br>
    <span>${scheme.summary}</span>
  `;
}

function renderScore(scheme) {
  const ring = document.getElementById('scoreRing');
  const value = document.getElementById('scoreValue');
  const status = document.getElementById('scoreStatus');

  if (!ring || !value || !status || !scheme) return;

  const score = Math.max(0, Math.min(100, scheme.readinessScore || 0));
  const angle = (score / 100) * 360;
  ring.style.background = `conic-gradient(var(--primary) ${angle}deg, #e2e8f0 0deg 360deg)`;
  value.textContent = `${score}%`;

  if (scheme.eligible) {
    status.textContent = 'Ready to proceed';
  } else if (scheme.missingDocs.length) {
    status.textContent = 'Documents still need verification';
  } else if (scheme.missingFields.length) {
    status.textContent = 'Profile details still need to be filled';
  } else {
    status.textContent = 'This scheme needs a closer profile match';
  }
}

function renderMissingDetails(scheme) {
  const list = document.getElementById('missingDetailsList');
  const badge = document.getElementById('detailCountBadge');
  if (!list || !badge || !scheme) return;

  const missingFields = scheme.missingFields || [];
  badge.textContent = `${missingFields.length} missing`;

  if (!missingFields.length) {
    list.innerHTML = '<div class="empty-box">No missing details for this scheme.</div>';
    renderFieldEditor([]);
    return;
  }

  list.innerHTML = missingFields.map(field => `
    <div class="check-row missing">
      <div class="check-label"><span class="check-dot">!</span>${getLabelForField(field)}</div>
      <small>Needed</small>
    </div>
  `).join('');

  renderFieldEditor(missingFields);
}

function renderRequiredDocuments(scheme) {
  const list = document.getElementById('requiredDocumentsList');
  const badge = document.getElementById('documentCountBadge');
  if (!list || !badge || !scheme) return;

  const missingDocs = scheme.missingDocs || [];
  badge.textContent = `${missingDocs.length} missing`;

  const rows = scheme.requiredDocs.map(doc => {
    const isMissing = missingDocs.includes(doc);
    return `
      <div class="check-row ${isMissing ? 'missing' : 'ok'}">
        <div class="check-label"><span class="check-dot">${isMissing ? '!' : '✓'}</span>${doc}</div>
        <small>${isMissing ? 'Missing' : 'Verified'}</small>
      </div>
    `;
  }).join('');

  list.innerHTML = rows;
}

function renderServiceCards(scheme) {
  const container = document.getElementById('serviceCards');
  if (!container) return;

  const district = state.profile?.district || 'Chennai';
  const taluk = state.profile?.district || 'Chennai';

  const offices = [
    { name: 'District Collectorate', icon: 'DC', color: '#2563eb', summary: `District support and correction for ${district}.`, query: `District Collectorate ${district} Tamil Nadu` },
    { name: 'Taluk Office', icon: 'TO', color: '#059669', summary: `Taluk-level service correction for ${taluk}.`, query: `Taluk Office ${taluk} ${district} Tamil Nadu` },
    { name: 'Arasu e-Sevai Centre', icon: 'E', color: '#7c3aed', summary: 'Citizen service desk for verification and correction.', query: `Arasu e-Sevai Centre ${taluk} ${district} Tamil Nadu` },
    { name: 'Social Welfare Office', icon: 'SW', color: '#db2777', summary: 'Scheme status, document mismatch and correction support.', query: `Social Welfare Office ${district} Tamil Nadu` }
  ];

  container.innerHTML = offices.map(office => `
    <div class="service-card">
      <div class="service-header">
        <div class="service-icon" style="background:${office.color};">${office.icon}</div>
        <div class="service-name">${office.name}</div>
      </div>
      <div class="service-summary">${office.summary}</div>
      <a class="service-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.query)}" target="_blank" rel="noopener noreferrer">Open in Maps →</a>
    </div>
  `).join('');
}

async function persistProfile(profile) {
  state.profile = normalizeProfile(profile);
  saveProfileToSession(state.profile);

  if (state.user && supabase) {
    try {
      const payload = {
        uid: state.user.id,
        email: state.user.email,
        phone: profile.phone || state.profile.phone || '',
        gender: profile.gender || state.profile.gender || '',
        state: profile.state || state.profile.state || '',
        district: profile.district || state.profile.district || '',
        residence_type: profile.residence || state.profile.residence || '',
        occupation: profile.occupation || state.profile.occupation || '',
        annual_family_income: profile.annual_income || profile.incomeNumeric || state.profile.incomeNumeric || 0,
        social_category: profile.social_category || state.profile.social_category || '',
        marital_status: profile.marital_status || state.profile.marital_status || '',
        disability_status: profile.disability || state.profile.disability || '',
        education_level: profile.education || state.profile.education || '',
        employment_status: profile.employment || state.profile.employment || '',
        family_size: profile.family_size || state.profile.family_size || '',
        special_beneficiary_status: profile.special || state.profile.special || '',
        date_of_birth: profile.date_of_birth || state.profile.date_of_birth || '',
        updated_at: new Date().toISOString()
      };

      await supabase.from('user_info').upsert(payload, { onConflict: 'uid' });
    } catch (error) {
      console.warn('[UNIORA Readiness] Failed to sync profile', error);
    }
  }
}

function handleDetailSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = form.querySelectorAll('[data-fill-field]');
  const updated = { ...state.profile };

  fields.forEach(field => {
    const key = field.dataset.fillField;
    let value = field.value;

    if (field.type === 'number') {
      value = value === '' ? '' : Number(value);
    }

    if (key === 'annual_income') {
      updated.annual_income = value;
      updated.incomeNumeric = parseIncomeValue(value);
    } else if (key === 'age') {
      updated.age = value;
      if (updated.date_of_birth === '') {
        updated.date_of_birth = '';
      }
    } else {
      updated[key] = value;
    }
  });

  persistProfile(updated).then(() => renderReadiness());
}

function updateEligibleCount() {
  const eligibleCountEl = document.getElementById('eligibleCount');
  const bestEl = document.getElementById('bestReadiness');
  const schemes = state.eligibleSchemes || [];
  if (!eligibleCountEl || !bestEl) return;

  const eligibleCount = schemes.filter(scheme => scheme.eligible).length;
  eligibleCountEl.textContent = String(eligibleCount);

  const bestScore = schemes.length ? Math.max(...schemes.map(s => s.readinessScore || 0)) : 0;
  bestEl.textContent = `${bestScore}%`;
}

function renderReadiness() {
  const schemes = getEligibleSchemes();
  state.eligibleSchemes = schemes;

  if (!schemes.length) {
    const selector = document.getElementById('schemeSelector');
    if (selector) selector.innerHTML = '<option value="">No schemes available</option>';
    document.getElementById('schemeMeta').innerHTML = '<div class="empty-box">Add your profile details to see schemes based on your eligibility.</div>';
    return;
  }

  if (!state.selectedSchemeId || !schemes.some(s => s.id === state.selectedSchemeId)) {
    state.selectedSchemeId = schemes[0].id;
  }

  renderSchemeOptions();
  const selected = schemes.find(scheme => scheme.id === state.selectedSchemeId) || schemes[0];

  renderMeta(selected);
  renderScore(selected);
  renderMissingDetails(selected);
  renderRequiredDocuments(selected);
  renderServiceCards(selected);
  updateEligibleCount();

  const selector = document.getElementById('schemeSelector');
  if (selector) {
    selector.onchange = (event) => {
      state.selectedSchemeId = event.target.value;
      renderReadiness();
    };
  }

  const form = document.getElementById('detailFillForm');
  if (form) form.onsubmit = handleDetailSubmit;
}

async function loadProfileRuntime() {
  const currentUser = await getCurrentUser();
  state.user = currentUser;

  if (currentUser && supabase) {
    try {
      const { data, error } = await supabase.from('user_info').select('*').eq('uid', currentUser.id).maybeSingle();
      if (!error && data) {
        state.profile = normalizeProfile(data);
      }
    } catch (error) {
      console.warn('[UNIORA Readiness] Could not load profile from Supabase', error);
    }
  }

  if (!state.profile) {
    state.profile = normalizeProfile(buildInitialProfile());
  }

  state.verifiedDocs = readVerifiedDocs();
  state.sessionReady = true;

  const badge = document.getElementById('userStateBadge');
  if (badge) {
    badge.textContent = state.user ? 'Logged in' : 'Guest mode';
  }
}

function setupActions() {
  const verifyBtn = document.getElementById('verifyDocumentsBtn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      window.location.href = '../../../features/03_documents_verification/frontend/index.html';
    });
  }

  const backBtn = document.getElementById('goBackDocBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '../../../features/03_documents_verification/frontend/index.html';
    });
  }

  const continueBtn = document.getElementById('continueApplyBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      const selected = state.eligibleSchemes.find(item => item.id === state.selectedSchemeId) || state.eligibleSchemes[0];
      if (!selected) return;

      if (selected.missingFields.length || selected.missingDocs.length) {
        alert('Please complete the missing details and verify required documents before applying.');
        return;
      }

      alert(`You are ready to proceed with ${selected.name}. You can continue to the application workflow or government service support.`);
    });
  }

  const serviceBtn = document.getElementById('correctServiceBtn');
  if (serviceBtn) {
    serviceBtn.addEventListener('click', () => {
      window.location.href = '../../../features/06_government_services/frontend/index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initActiveNavLink();
  initNavbarMenu();
  await initNavbarAuth();
  await loadProfileRuntime();
  setupActions();
  renderReadiness();
});
