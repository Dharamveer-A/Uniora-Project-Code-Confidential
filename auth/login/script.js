/* ==========================================================================
   UNIORA PLATFORM - GOOGLE AUTHENTICATION LOGIN SCRIPT
   File: auth/login/script.js
   Google OAuth sign-in + routing of already signed-in users:
     signed in + profile complete   -> dashboard
     signed in + profile incomplete -> signup (profile completion)
     not signed in                  -> show the sign-in form
   ========================================================================== */

import { signInWithGoogle, resolveAuthRoute } from '../../common/js/auth.js';
import { $ } from '../../common/js/common.js';

const SIGNUP_PATH = '../signup/index.html';
const DASHBOARD_PATH = '../../dashboard/index.html';
const SESSION_CHECK_TIMEOUT_MS = 6000;

const DEFAULT_LABEL = 'Continue with Google';
const RETRY_LABEL = 'Try again with Google';
const BUSY_LABEL = 'Connecting to Google…';

const ICONS = {
  error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>'
};

let googleLoginBound = false;

document.addEventListener('DOMContentLoaded', init);

/* Coming back with the browser Back button can restore this page from cache
   (bfcache) with the button stuck in its loading state, and without re-running
   the session check. Reset the UI and check the session again. */
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    setBusy(false);
    setLabel(DEFAULT_LABEL);
    clearAuthMessage();
    init();
  }
});

async function init() {
  // Hide the form while we check for an existing session (no flash of the sign-in UI)
  // Google returns tokens in the hash (#access_token) or a ?code= query
  const cameFromGoogle = /access_token=|[?&]code=/.test(window.location.href);
  setChecking(true, cameFromGoogle ? 'Signing you in…' : 'Checking your session…');

  const urlError = readErrorFromUrl();

  let result = { user: null, route: 'login' };
  try {
    result = await withTimeout(resolveAuthRoute(), SESSION_CHECK_TIMEOUT_MS);
  } catch (err) {
    // Treat a slow or failed session check as "not signed in" and let the person sign in
    console.warn('Session check failed:', err);
  }

  if (result.route === 'dashboard') {
    // Returning user with a complete profile: straight to home
    setChecking(true, 'You are signed in. Taking you to your dashboard…');
    window.location.replace(DASHBOARD_PATH);
    return;
  }

  if (result.route === 'signup') {
    // First-time user (or incomplete profile): profile completion.
    // signup/script.js re-checks and shows the questionnaire.
    setChecking(true, 'You are signed in. Taking you to your profile…');
    window.location.replace(SIGNUP_PATH);
    return;
  }

  // Not signed in
  setChecking(false);
  initGoogleLogin();

  if (urlError) {
    showAuthMessage(urlError, 'error');
    setLabel(RETRY_LABEL);
  } else if (!navigator.onLine) {
    showAuthMessage('You appear to be offline. Connect to the internet to sign in.', 'info');
  }
}

/* ---------- UI helpers ---------- */

/**
 * Display message in accessible auth-message container
 * @param {string} text
 * @param {'error'|'success'|'info'} type
 */
function showAuthMessage(text, type = 'error') {
  const msgEl = $('#authMessage');
  if (!msgEl) return;

  msgEl.className = `auth-message active ${type}`;
  // Errors interrupt screen readers; info and success wait politely
  msgEl.setAttribute('role', type === 'error' ? 'alert' : 'status');

  msgEl.innerHTML = ICONS[type] || '';
  const span = document.createElement('span');
  span.textContent = text; // textContent keeps any dynamic text safe
  msgEl.appendChild(span);
}

/**
 * Clear authentication message
 */
function clearAuthMessage() {
  const msgEl = $('#authMessage');
  if (!msgEl) return;
  msgEl.className = 'auth-message';
  msgEl.removeAttribute('role');
  msgEl.textContent = '';
}

function setLabel(text) {
  const label = $('#googleLoginLabel');
  if (label) label.textContent = text;
}

function setBusy(isBusy) {
  const btn = $('#googleLoginBtn');
  if (!btn) return;
  btn.setAttribute('aria-busy', String(isBusy));
  btn.disabled = isBusy;
  if (isBusy) setLabel(BUSY_LABEL);
}

function setChecking(isChecking, text) {
  const card = $('#loginCard');
  const checking = $('#loginChecking');
  const checkingText = $('#loginCheckingText');
  if (!card || !checking) return;

  card.classList.toggle('is-checking', isChecking);
  checking.hidden = !isChecking;
  if (isChecking && checkingText && text) checkingText.textContent = text;
}

/* ---------- Errors coming back from Google / Supabase ---------- */

/**
 * If OAuth sent the person back here with an error in the URL
 * (query string or hash), return a plain-language message and tidy the URL.
 * @returns {string|null}
 */
function readErrorFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = params.get('error') || hashParams.get('error');
  const errorCode = params.get('error_code') || hashParams.get('error_code');

  if (!code) return null;

  // Remove the error from the address bar so a refresh doesn't show it again
  window.history.replaceState({}, document.title, window.location.pathname);

  if (code === 'access_denied' || errorCode === 'access_denied') {
    return 'Sign-in was cancelled. Choose "Try again with Google" when you\'re ready.';
  }
  return 'We couldn\'t complete sign-in with Google. Please try again.';
}

/* ---------- Sign-in ---------- */

/**
 * Initialize Google OAuth Sign In Click Handler (bound only once)
 */
function initGoogleLogin() {
  const googleBtn = $('#googleLoginBtn');
  if (!googleBtn || googleLoginBound) return;
  googleLoginBound = true;

  googleBtn.addEventListener('click', async () => {
    if (googleBtn.getAttribute('aria-busy') === 'true') return;

    clearAuthMessage();

    if (!navigator.onLine) {
      showAuthMessage('You appear to be offline. Check your connection and try again.', 'error');
      setLabel(RETRY_LABEL);
      return;
    }

    setBusy(true);

    // Absolute URL of auth/signup/index.html, resolved from this page's location.
    // Google returns here; signup/script.js then sends returning users to the dashboard.
    // Google returns to THIS page. init() shows the loader, checks the session and
    // profile, then sends returning users to the dashboard and new users to signup.
    const redirectTarget = new URL('./index.html', window.location.href).href;
    let error = null;
    try {
      ({ error } = await signInWithGoogle(redirectTarget));
    } catch (err) {
      error = err;
    }

    if (error) {
      console.error('Google sign-in error:', error);
      setBusy(false);
      setLabel(RETRY_LABEL);
      showAuthMessage(
        'We couldn\'t connect to Google. Check your internet connection and try again.',
        'error'
      );
    }
    // On success the browser navigates to Google, so the busy state stays until then.
  });
}

/* ---------- Utilities ---------- */

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms))
  ]);
}