/* ==========================================================================
   UNIORA PLATFORM - CITIZEN PROFILE COMPLETION SCRIPT
   File: auth/signup/script.js
   Handles Authentication Verification, 4-Step Wizard Navigation,
   State/District Dropdowns, 15-Question Validation, and Supabase
   USER_PROFILE / USER_INFO Storage Flow
   ========================================================================== */

import { getCurrentUser } from '../../common/js/auth.js';
import { supabase } from '../../common/js/supabase.js';
import { $, setText, setLoadingState } from '../../common/js/common.js';
import { getUserInfo, isUserInfoComplete } from '../../common/js/profile.js';

let currentUser = null;
let statesDistrictsData = null;
const TOTAL_STEPS = 4;
let currentStep = 1;
let maxStepReached = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verify User Authentication
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.replace('../login/index.html');
    return;
  }

  // 2. Ensure USER_PROFILE identity record exists
  await ensureUserProfileExists(currentUser);

  // 3. Returning user with a complete profile goes straight to the dashboard
  const isComplete = await checkExistingUserInfo(currentUser.id);
  if (isComplete) {
    window.location.replace('../../dashboard/index.html');
    return;
  }

  // 4. Load States and Districts JSON Data
  await loadStatesAndDistricts();

  // 5. Initialize Step Wizard + Form Event Handlers
  initStepNav();
  initFormHandler();
  goToStep(1);
});

/**
 * Display message in accessible profileMessage container
 * @param {string} text
 * @param {'error'|'success'|'info'} type
 */
function showProfileMessage(text, type = 'error') {
  const msgEl = $('#profileMessage');
  if (!msgEl) return;
  msgEl.className = `auth-message active ${type}`;
  setText(msgEl, text);
  msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Clear profile alert message
 */
function clearProfileMessage() {
  const msgEl = $('#profileMessage');
  if (msgEl) {
    msgEl.className = 'auth-message';
    setText(msgEl, '');
  }
}

/**
 * Ensure USER_PROFILE record exists in Supabase
 * @param {Object} user
 */
async function ensureUserProfileExists(user) {
  if (!supabase || !user) return;
  try {
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Citizen';
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    await supabase.from('user_profile').upsert({
      uid: user.id,
      email: user.email,
      name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'uid' });
  } catch (e) {
    // Non-blocking fallback
  }
}

/**
 * Check if user already has a complete user_info record.
 * Uses the shared helpers in common/js/profile.js so the "complete"
 * rule lives in one place.
 * @param {string} uid
 * @returns {Promise<boolean>} True if user_info exists and is complete
 */
async function checkExistingUserInfo(uid) {
  const { info, error } = await getUserInfo(uid);
  if (error || !info) return false;

  if (isUserInfoComplete(info)) return true;

  // Partial record: pre-fill what we already have
  prefillExistingFormValues(info);
  return false;
}

/**
 * Pre-fill existing form inputs for incomplete record
 * @param {Object} info
 */
function prefillExistingFormValues(info) {
  const fieldMapping = {
    phone: '#phone',
    date_of_birth: '#dateOfBirth',
    gender: '#gender',
    residence_type: '#residenceType',
    occupation: '#occupation',
    annual_family_income: '#annualFamilyIncome',
    social_category: '#socialCategory',
    marital_status: '#maritalStatus',
    disability_status: '#disabilityStatus',
    education_level: '#educationLevel',
    employment_status: '#employmentStatus',
    family_size: '#familySize',
    special_beneficiary_status: '#specialBeneficiaryStatus'
  };

  Object.entries(fieldMapping).forEach(([dbKey, selector]) => {
    const input = $(selector);
    if (!input || !info[dbKey]) return;

    // State and District options are populated asynchronously after this
    // runs, so stash the intended value and apply it once options exist.
    if (selector === '#state' || selector === '#district') {
      input.dataset.prefill = info[dbKey];
    } else {
      input.value = info[dbKey];
    }
  });
}

/**
 * Load States and Districts JSON dataset and bind dynamic dropdown logic
 */
async function loadStatesAndDistricts() {
  const stateSelect = $('#state');
  const districtSelect = $('#district');
  if (!stateSelect || !districtSelect) return;

  try {
    const response = await fetch('../../common/data/state_districts.json');
    if (!response.ok) throw new Error('Failed to load geographical data');

    statesDistrictsData = await response.json();

    const allRegions = [
      ...(statesDistrictsData.states || []),
      ...(statesDistrictsData.union_territories || [])
    ].sort((a, b) => a.name.localeCompare(b.name));

    stateSelect.innerHTML = '<option value="" disabled selected>Select State / UT</option>';
    allRegions.forEach(region => {
      const opt = document.createElement('option');
      opt.value = region.name;
      opt.textContent = region.name;
      stateSelect.appendChild(opt);
    });

    // Re-apply a prefilled state value (if any) now that options exist
    if (stateSelect.dataset.prefill) {
      stateSelect.value = stateSelect.dataset.prefill;
      populateDistricts(stateSelect.value, allRegions);
      if (districtSelect.dataset.prefill) {
        districtSelect.value = districtSelect.dataset.prefill;
      }
    }

    stateSelect.addEventListener('change', () => {
      const selectedStateName = stateSelect.value;
      populateDistricts(selectedStateName, allRegions);
    });

  } catch (err) {
    stateSelect.innerHTML = '<option value="" disabled selected>Failed to load states</option>';
    showProfileMessage('Could not load states list. Please refresh the page.', 'error');
  }
}

/**
 * Populate district dropdown based on selected state
 * @param {string} stateName
 * @param {Array} regions
 */
function populateDistricts(stateName, regions) {
  const districtSelect = $('#district');
  if (!districtSelect) return;

  const targetRegion = regions.find(r => r.name === stateName);

  if (targetRegion && Array.isArray(targetRegion.districts)) {
    districtSelect.innerHTML = '<option value="" disabled selected>Select District</option>';
    targetRegion.districts.sort().forEach(dist => {
      const opt = document.createElement('option');
      opt.value = dist;
      opt.textContent = dist;
      districtSelect.appendChild(opt);
    });
    districtSelect.disabled = false;
  } else {
    districtSelect.innerHTML = '<option value="" disabled selected>No districts available</option>';
    districtSelect.disabled = true;
  }
}

/* --------------------------------------------------------------------------
   STEP WIZARD NAVIGATION
   -------------------------------------------------------------------------- */

/**
 * Per-step field validators. Each returns an error message string,
 * or an empty string when the step's fields are all valid.
 */
const stepValidators = {
  1: () => {
    const phone = $('#phone')?.value.trim();
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      $('#phone')?.focus();
      return 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }

    const dateOfBirth = $('#dateOfBirth')?.value;
    if (!dateOfBirth) {
      $('#dateOfBirth')?.focus();
      return 'Please select your Date of Birth.';
    }
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
      $('#dateOfBirth')?.focus();
      return 'Date of Birth cannot be in the future.';
    }

    if (!$('#gender')?.value) {
      $('#gender')?.focus();
      return 'Please select your Gender.';
    }

    return '';
  },

  2: () => {
    const fields = [
      { id: '#state', name: 'State' },
      { id: '#district', name: 'District' },
      { id: '#residenceType', name: 'Residence Type' }
    ];
    for (const f of fields) {
      const el = $(f.id);
      if (!el?.value) {
        el?.focus();
        return `Please select your ${f.name}.`;
      }
    }
    return '';
  },

  3: () => {
    const fields = [
      { id: '#occupation', name: 'Primary Occupation' },
      { id: '#annualFamilyIncome', name: 'Annual Family Income' },
      { id: '#employmentStatus', name: 'Employment Status' }
    ];
    for (const f of fields) {
      const el = $(f.id);
      if (!el?.value) {
        el?.focus();
        return `Please select your ${f.name}.`;
      }
    }
    return '';
  },

  4: () => {
    const fields = [
      { id: '#socialCategory', name: 'Social Category' },
      { id: '#maritalStatus', name: 'Marital Status' },
      { id: '#disabilityStatus', name: 'Disability Status' },
      { id: '#educationLevel', name: 'Education Level' },
      { id: '#familySize', name: 'Family Size' },
      { id: '#specialBeneficiaryStatus', name: 'Special Category' }
    ];
    for (const f of fields) {
      const el = $(f.id);
      if (!el?.value) {
        el?.focus();
        return `Please select your ${f.name}.`;
      }
    }
    return '';
  }
};

/**
 * Validate a given step's fields. Shows an error message and returns
 * false if invalid; clears messages and returns true if valid.
 * @param {number} stepNumber
 */
function validateStep(stepNumber) {
  const validator = stepValidators[stepNumber];
  if (!validator) return true;

  const errorMessage = validator();
  if (errorMessage) {
    showProfileMessage(errorMessage, 'error');
    return false;
  }

  clearProfileMessage();
  return true;
}

/**
 * Show the requested step, hide the rest, and sync the step-nav UI.
 * @param {number} stepNumber
 */
function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > TOTAL_STEPS) return;

  document.querySelectorAll('.form-step').forEach(step => {
    const stepNum = Number(step.dataset.step);
    step.classList.toggle('is-active', stepNum === stepNumber);
  });

  currentStep = stepNumber;
  maxStepReached = Math.max(maxStepReached, stepNumber);
  updateStepNav();

  const card = document.querySelector('.signup-card');
  card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Sync the visual state (active / complete) of the step-nav markers.
 */
function updateStepNav() {
  document.querySelectorAll('.step-nav-item').forEach(item => {
    const target = Number(item.dataset.stepTarget);
    item.classList.toggle('is-active', target === currentStep);
    item.classList.toggle('is-complete', target < currentStep);
  });
}

/**
 * Wire up Next / Previous buttons and clickable step-nav markers.
 */
function initStepNav() {
  document.querySelectorAll('.step-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      const next = Number(btn.dataset.next);
      goToStep(next);
    });
  });

  document.querySelectorAll('.step-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      clearProfileMessage();
      const prev = Number(btn.dataset.prev);
      goToStep(prev);
    });
  });

  document.querySelectorAll('.step-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = Number(item.dataset.stepTarget);
      // Only allow jumping to a step already reached, to keep the
      // "one step's data leads to the next" flow intact.
      if (target <= maxStepReached) {
        clearProfileMessage();
        goToStep(target);
      }
    });
  });
}

/**
 * Initialize Form Submission & Final Validation
 */
function initFormHandler() {
  const form = $('#profileInfoForm');
  const submitBtn = $('#profileSubmitBtn');
  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearProfileMessage();

    // Re-validate every step as a final safety net before saving
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      if (!validateStep(step)) {
        goToStep(step);
        return;
      }
    }

    // Collect 15 form values
    const phone = $('#phone')?.value.trim();
    const dateOfBirth = $('#dateOfBirth')?.value;
    const gender = $('#gender')?.value;
    const state = $('#state')?.value;
    const district = $('#district')?.value;
    const residenceType = $('#residenceType')?.value;
    const occupation = $('#occupation')?.value;
    const annualFamilyIncome = $('#annualFamilyIncome')?.value;
    const socialCategory = $('#socialCategory')?.value;
    const maritalStatus = $('#maritalStatus')?.value;
    const disabilityStatus = $('#disabilityStatus')?.value;
    const educationLevel = $('#educationLevel')?.value;
    const employmentStatus = $('#employmentStatus')?.value;
    const familySize = $('#familySize')?.value;
    const specialBeneficiaryStatus = $('#specialBeneficiaryStatus')?.value;

    const userInfoPayload = {
      uid: currentUser.id,
      phone: phone,
      date_of_birth: dateOfBirth,
      gender: gender,
      state: state,
      district: district,
      residence_type: residenceType,
      occupation: occupation,
      annual_family_income: annualFamilyIncome,
      social_category: socialCategory,
      marital_status: maritalStatus,
      disability_status: disabilityStatus,
      education_level: educationLevel,
      employment_status: employmentStatus,
      family_size: familySize,
      special_beneficiary_status: specialBeneficiaryStatus
    };

    setLoadingState(submitBtn, true, 'Saving Profile...');

    try {
      if (!supabase) {
        throw new Error('Database client not initialized');
      }

      // Upsert into user_info table
      const { error: saveError } = await supabase
        .from('user_info')
        .upsert(userInfoPayload, { onConflict: 'uid' });

      if (saveError) {
        throw saveError;
      }

      // Verify record storage
      const { data: verifyData } = await supabase
        .from('user_info')
        .select('uid')
        .eq('uid', currentUser.id)
        .maybeSingle();

      if (!verifyData) {
        throw new Error('Verification failed. Could not confirm profile save.');
      }

      showProfileMessage('Profile completed successfully! Redirecting to Dashboard...', 'success');

      setTimeout(() => {
        window.location.replace('../../dashboard/index.html');
      }, 1000);

    } catch (err) {
      setLoadingState(submitBtn, false);
      showProfileMessage(err.message || 'Failed to save profile. Please check your network and try again.', 'error');
    }
  });
}