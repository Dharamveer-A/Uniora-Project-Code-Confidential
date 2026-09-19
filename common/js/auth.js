/* ==========================================================================
   UNIORA PLATFORM - SHARED AUTHENTICATION MODULE
   File: common/js/auth.js
   Handles Supabase Authentication (Email/Password, Google OAuth, Session Management)
   ========================================================================== */

import { supabase } from './supabase.js';
import { getUserInfo, isUserInfoComplete } from './profile.js';


/**
 * Get the currently authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current active auth session
 * @returns {Promise<Object|null>} Session object or null
 */
export async function getCurrentSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Check whether a user is currently logged in
 * @returns {Promise<boolean>} True if logged in
 */
export async function isLoggedIn() {
  const session = await getCurrentSession();
  return !!session;
}

/**
 * Sign in with Email and Password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function signInWithEmail(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign up with Email and Password
 * @param {string} email 
 * @param {string} password 
 * @param {Object} [metadata={}] Additional user metadata
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
}

/**
 * Sign in using Google OAuth provider
 * @param {string} [redirectTo] Custom redirect URL after OAuth completion
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function signInWithGoogle(redirectTo = window.location.origin) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
}

/**
 * Send password reset request email
 * @param {string} email 
 * @param {string} [redirectTo]
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function resetPassword(email, redirectTo = window.location.origin) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

/**
 * Sign out the current user session
 * @returns {Promise<{error: Object|null}>}
 */
export async function signOut() {
  if (!supabase) return { error: new Error('Supabase client not initialized') };
  return await supabase.auth.signOut();
}

/**
 * Subscribe to authentication state changes (LOGIN, LOGOUT, TOKEN_REFRESHED)
 * @param {Function} callback Callback function invoked on auth change
 * @returns {Object} Subscription listener object
 */
export function onAuthStateChange(callback) {
  if (!supabase) return { unsubscribe: () => {} };
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (typeof callback === 'function') {
      callback(event, session);
    }
  });
  return subscription;
}

/**
 * Decide where a visitor belongs, based on session + profile status.
 * Returns route keys (not URLs) because relative paths differ per page.
 *
 *   { user: null, route: 'login' }                      not signed in
 *   { user, route: 'signup', info, error? }             signed in, profile missing/incomplete
 *   { user, route: 'dashboard', info }                  signed in, profile complete
 *
 * If the database lookup fails, the profile is NOT assumed complete:
 * route is 'signup' and `error` is set, so callers can decide whether
 * to redirect (login page) or stay put (dashboard).
 * @returns {Promise<{user: Object|null, route: 'login'|'signup'|'dashboard', info?: Object|null, error?: Error}>}
 */
export async function resolveAuthRoute() {
  const user = await getCurrentUser();
  if (!user) return { user: null, route: 'login' };

  const { info, error } = await getUserInfo(user.id);
  if (error) return { user, route: 'signup', info: null, error };

  if (isUserInfoComplete(info)) return { user, route: 'dashboard', info };
  return { user, route: 'signup', info };
}