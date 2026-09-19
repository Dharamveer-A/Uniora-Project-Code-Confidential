/* ==========================================================================
   UNIORA PLATFORM – PROFILE PAGE SCRIPT
   File: features/10_profile/frontend/script.js
   ========================================================================== */

import { getCurrentUser, signOut } from '../../../common/js/auth.js';
import { supabase } from '../../../common/js/supabase.js';
import { $, setText, setLoadingState, formatDate } from '../../../common/js/common.js';
import { initNavbarAuth, initActiveNavLink, initNavbarMenu } from '../../../common/js/navbar.js';

let currentUser = null;
let profileData = null;
let userInfoData = null;
let geoData = null;
let isEditMode = false;

const LOGIN_URL = '../../../auth/login/index.html';
const GEO_JSON_URL = '../../../common/data/state_districts.json';

/* Total trackable welfare attributes for percentage calculation */
const TRACKED_FIELDS = [
  'phone', 'date_of_birth', 'gender', 'residence_type', 'state', 'district',
  'occupation', 'annual_family_income', 'social_category', 'marital_status',
  'disability_status', 'education_level', 'employment_status', 'family_size',
  'special_beneficiary_status'
];

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

async function initProfilePage() {
  showLoading(true);

  try {
    // 1. Navbar Navigation & Menu initialization
    initActiveNavLink();
    initNavbarMenu();

    // 2. Authentication guard
    currentUser = await getCurrentUser();

    if (!currentUser) {
      console.warn('[UNIORA Profile] No authenticated user. Redirecting...');
      window.location.href = LOGIN_URL;
      return;
    }

    // 3. Load geographic data & profile data concurrently
    const [geo, ] = await Promise.all([
      loadGeoData(),
      loadProfileData()
    ]);
    geoData = geo;

    // 4. Initialize common navbar auth state (0ms flicker-free)
    await initNavbarAuth();

    // 5. Render profile view & populate dropdowns
    renderProfile();
    populateStateDropdown();

    // 6. Bind event listeners
    bindEvents();

  } catch (error) {
    console.error('[UNIORA Profile] Initialization failed:', error);
    showMessage('Unable to load your profile. Please refresh and try again.', 'error');
  } finally {
    showLoading(false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfilePage, { once: true });
} else {
  initProfilePage();
}

/* ==========================================================================
   UI LOADING & MESSAGES
   ========================================================================== */

function showLoading(on) {
  const overlay = $('#profileLoadingOverlay');
  const main = $('#profileMain');

  if (on) {
    if (overlay) overlay.style.display = 'flex';
    if (main) main.hidden = true;
  } else {
    if (overlay) overlay.style.display = 'none';
    if (main) main.hidden = false;
  }
}

function showMessage(text, type = 'info') {
  const element = $('#profileMessage');
  if (!element) return;

  element.textContent = text;
  element.className = `profile-message active ${type}`;
  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearMessage() {
  const element = $('#profileMessage');
  if (!element) return;
  element.textContent = '';
  element.className = 'profile-message';
}

/* ==========================================================================
   DATA FETCHING
   ========================================================================== */

async function loadProfileData() {
  try {
    const [profileResult, infoResult] = await Promise.all([
      supabase.from('user_profile').select('*').eq('uid', currentUser.id).maybeSingle(),
      supabase.from('user_info').select('*').eq('uid', currentUser.id).maybeSingle()
    ]);

    profileData = profileResult.data || {};
    userInfoData = infoResult.data || {};
  } catch (error) {
    console.error('[UNIORA Profile] loadProfileData error:', error);
    profileData = {};
    userInfoData = {};
    showMessage('Unable to load your profile information.', 'error');
  }
}

async function loadGeoData() {
  try {
    const response = await fetch(GEO_JSON_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('[UNIORA Profile] loadGeoData fallback:', error);
    return null;
  }
}

/* ==========================================================================
   RENDER PROFILE & COMPLETION PROGRESS
   ========================================================================== */

function renderProfile() {
  const displayName = resolveDisplayName();
  const email = currentUser?.email || '';
  const initials = buildInitials(displayName);
  const avatarUrl = profileData?.avatar_url || currentUser?.user_metadata?.avatar_url || '';
  const createdAt = profileData?.created_at;

  setText('#summaryName', displayName);
  setText('#summaryEmail', email);
  setText('#summaryAvatarInitials', initials);

  if (createdAt) {
    setText('#summaryJoined', `Member since ${formatDate(createdAt)}`);
  }

  const avatarImg = $('#summaryAvatarImg');
  if (avatarUrl && avatarImg) {
    avatarImg.src = avatarUrl;
    avatarImg.hidden = false;
    setText('#summaryAvatarInitials', '');
  }

  // Populate field view values
  setFieldValue('phone', userInfoData?.phone);
  setFieldValue('dateOfBirth', formatDate(userInfoData?.date_of_birth));
  setFieldValue('gender', userInfoData?.gender);
  setFieldValue('residenceType', userInfoData?.residence_type);
  setFieldValue('state', userInfoData?.state);
  setFieldValue('district', userInfoData?.district);
  setFieldValue('occupation', userInfoData?.occupation);
  setFieldValue('annualFamilyIncome', userInfoData?.annual_family_income);
  setFieldValue('socialCategory', userInfoData?.social_category);
  setFieldValue('maritalStatus', userInfoData?.marital_status);
  setFieldValue('disabilityStatus', userInfoData?.disability_status);
  setFieldValue('educationLevel', userInfoData?.education_level);
  setFieldValue('employmentStatus', userInfoData?.employment_status);
  setFieldValue('familySize', userInfoData?.family_size);
  setFieldValue('specialBeneficiaryStatus', userInfoData?.special_beneficiary_status);

  // Update Profile Completion Percentage Bar
  updateCompletionProgress();
}

function setFieldValue(id, value) {
  const span = $(`#${id}-view`);
  if (!span) return;

  const text = value !== null && value !== undefined && String(value).trim() !== '' ? String(value) : '';
  span.textContent = text || 'Not provided';
  span.dataset.empty = text ? 'false' : 'true';
}

function updateCompletionProgress() {
  let filledCount = 0;

  TRACKED_FIELDS.forEach(field => {
    const val = userInfoData?.[field];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      filledCount++;
    }
  });

  const percentage = Math.round((filledCount / TRACKED_FIELDS.length) * 100);

  const percentageText = $('#completionPercentage');
  const fillBar = $('#completionFill');

  if (percentageText) percentageText.textContent = `${percentage}%`;
  if (fillBar) fillBar.style.width = `${percentage}%`;
}

/* ==========================================================================
   GEO DROPDOWNS
   ========================================================================== */

function getAllRegions() {
  if (!geoData) return [];
  return [...(geoData.states || []), ...(geoData.union_territories || [])].sort((a, b) => a.name.localeCompare(b.name));
}

function populateStateDropdown() {
  const stateSelect = $('#state');
  if (!stateSelect || !geoData) return;

  const allRegions = getAllRegions();
  stateSelect.innerHTML = '<option value="" disabled selected>Select State / UT</option>';

  allRegions.forEach(region => {
    const option = document.createElement('option');
    option.value = region.name;
    option.textContent = region.name;
    stateSelect.appendChild(option);
  });

  const savedState = userInfoData?.state;
  if (savedState) {
    stateSelect.value = savedState;
    populateDistrictDropdown(savedState, allRegions);
  }

  stateSelect.addEventListener('change', () => {
    populateDistrictDropdown(stateSelect.value, allRegions);
  });
}

function populateDistrictDropdown(stateName, allRegions) {
  const districtSelect = $('#district');
  if (!districtSelect) return;

  const region = allRegions.find(item => item.name === stateName);

  if (region && Array.isArray(region.districts)) {
    districtSelect.innerHTML = '<option value="" disabled selected>Select District</option>';
    region.districts.slice().sort().forEach(district => {
      const option = document.createElement('option');
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;

    if (userInfoData?.district && userInfoData?.state === stateName) {
      districtSelect.value = userInfoData.district;
    }
  } else {
    districtSelect.innerHTML = '<option value="" disabled selected>No districts available</option>';
    districtSelect.disabled = true;
  }
}

/* ==========================================================================
   EDIT MODE CONTROLLER
   ========================================================================== */

function enterEditMode() {
  isEditMode = true;

  fillInput('phone', userInfoData?.phone);
  fillInput('dateOfBirth', userInfoData?.date_of_birth);
  fillInput('gender', userInfoData?.gender);
  fillInput('residenceType', userInfoData?.residence_type);
  fillInput('state', userInfoData?.state);
  fillInput('occupation', userInfoData?.occupation);
  fillInput('annualFamilyIncome', userInfoData?.annual_family_income);
  fillInput('socialCategory', userInfoData?.social_category);
  fillInput('maritalStatus', userInfoData?.marital_status);
  fillInput('disabilityStatus', userInfoData?.disability_status);
  fillInput('educationLevel', userInfoData?.education_level);
  fillInput('employmentStatus', userInfoData?.employment_status);
  fillInput('familySize', userInfoData?.family_size);
  fillInput('specialBeneficiaryStatus', userInfoData?.special_beneficiary_status);

  const allRegions = getAllRegions();
  if (geoData && userInfoData?.state) {
    populateDistrictDropdown(userInfoData.state, allRegions);
    setTimeout(() => fillInput('district', userInfoData?.district), 0);
  }

  toggleFieldVisibility(true);

  $('#saveBtn')?.removeAttribute('hidden');
  $('#cancelBtn')?.removeAttribute('hidden');

  const editButton = $('#editProfileBtn');
  if (editButton) {
    editButton.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Editing…</span>
    `;
    editButton.disabled = true;
  }

  clearMessage();
}

function exitEditMode() {
  isEditMode = false;
  toggleFieldVisibility(false);

  $('#saveBtn')?.setAttribute('hidden', '');
  $('#cancelBtn')?.setAttribute('hidden', '');

  const editButton = $('#editProfileBtn');
  if (editButton) {
    editButton.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      <span>Edit Profile</span>
    `;
    editButton.disabled = false;
  }
}

function toggleFieldVisibility(edit) {
  document.querySelectorAll('.field-value').forEach(el => el.hidden = edit);
  document.querySelectorAll('.field-input').forEach(el => el.hidden = !edit);
}

function fillInput(id, value) {
  const el = $(`#${id}`);
  if (el && value !== null && value !== undefined) {
    el.value = String(value);
  }
}

/* ==========================================================================
   SAVE CHANGES & SUPABASE UPSERT
   ========================================================================== */

async function saveProfileChanges() {
  const saveButton = $('#saveBtn');
  const phone = $('[name="phone"]')?.value.trim();
  const dateOfBirth = $('[name="dateOfBirth"]')?.value;

  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    showMessage('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.', 'error');
    $('#phone')?.focus();
    return;
  }

  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      showMessage('Date of Birth cannot be in the future.', 'error');
      $('#dateOfBirth')?.focus();
      return;
    }
  }

  clearMessage();
  setLoadingState(saveButton, true, 'Saving…');

  try {
    const now = new Date().toISOString();
    const userInfoPayload = {
      uid: currentUser.id,
      phone: phone || null,
      date_of_birth: dateOfBirth || null,
      gender: $('[name="gender"]')?.value || null,
      state: $('[name="state"]')?.value || null,
      district: $('[name="district"]')?.value || null,
      residence_type: $('[name="residenceType"]')?.value || null,
      occupation: $('[name="occupation"]')?.value || null,
      annual_family_income: $('[name="annualFamilyIncome"]')?.value || null,
      social_category: $('[name="socialCategory"]')?.value || null,
      marital_status: $('[name="maritalStatus"]')?.value || null,
      disability_status: $('[name="disabilityStatus"]')?.value || null,
      education_level: $('[name="educationLevel"]')?.value || null,
      employment_status: $('[name="employmentStatus"]')?.value || null,
      family_size: $('[name="familySize"]')?.value || null,
      special_beneficiary_status: $('[name="specialBeneficiaryStatus"]')?.value || null
    };

    const { error: infoError } = await supabase.from('user_info').upsert(userInfoPayload, { onConflict: 'uid' });
    if (infoError) throw infoError;

    await supabase.from('user_profile').upsert({ uid: currentUser.id, updated_at: now }, { onConflict: 'uid' });

    userInfoData = { ...userInfoData, ...userInfoPayload };
    renderProfile();
    showMessage('Profile updated successfully! Your scheme eligibility recommendations are now refreshed.', 'success');
    exitEditMode();
  } catch (error) {
    console.error('[UNIORA Profile] saveProfileChanges error:', error);
    showMessage('Failed to save changes. Please check your network connection and try again.', 'error');
  } finally {
    setLoadingState(saveButton, false);
  }
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

async function handleLogout() {
  const logoutButton = $('#logoutBtn');
  if (logoutButton) {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out…';
  }

  try {
    const { error } = await signOut();
    if (error) throw error;
    window.location.href = LOGIN_URL;
  } catch (error) {
    console.error('[UNIORA Profile] Logout failed:', error);
    if (logoutButton) {
      logoutButton.disabled = false;
      logoutButton.textContent = 'Logout';
    }
    showMessage('Logout failed. Please try again.', 'error');
  }
}

/* ==========================================================================
   EVENT BINDING & UTILS
   ========================================================================== */

function bindEvents() {
  $('#editProfileBtn')?.addEventListener('click', () => {
    if (!isEditMode) enterEditMode();
  });

  $('#profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isEditMode) await saveProfileChanges();
  });

  $('#cancelBtn')?.addEventListener('click', exitEditMode);
  $('#logoutBtn')?.addEventListener('click', handleLogout);
}

function resolveDisplayName() {
  return profileData?.name || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Citizen';
}

function buildInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').substring(0, 2).toUpperCase() || 'UN';
}
