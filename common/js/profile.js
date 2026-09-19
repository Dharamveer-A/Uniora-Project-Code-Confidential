/* ==========================================================================
   UNIORA PLATFORM - PROFILE COMPLETENESS HELPERS
   File: common/js/profile.js
   Single source of truth for "has this user finished their profile?"
   No DOM code and no redirects here.
   ========================================================================== */

import { supabase } from './supabase.js';

export const REQUIRED_USER_INFO_FIELDS = [
  'phone', 'date_of_birth', 'gender', 'state', 'district',
  'residence_type', 'occupation', 'annual_family_income',
  'social_category', 'marital_status', 'disability_status',
  'education_level', 'employment_status', 'family_size',
  'special_beneficiary_status'
];

/**
 * True only if the row exists and all 15 required fields are filled in.
 * @param {Object|null} info user_info row
 * @returns {boolean}
 */
export function isUserInfoComplete(info) {
  if (!info) return false;
  return REQUIRED_USER_INFO_FIELDS.every((field) => {
    const value = info[field];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

/**
 * Fetch the user_info row for a user.
 * @param {string} uid
 * @returns {Promise<{info: Object|null, error: Error|null}>}
 *   info is null with error null when the user simply has no row yet.
 */
export async function getUserInfo(uid) {
  if (!supabase || !uid) {
    return { info: null, error: new Error('Supabase client not initialized or missing uid') };
  }

  try {
    const { data, error } = await supabase
      .from('user_info')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.warn('[UNIORA] user_info lookup failed:', error);
      return { info: null, error };
    }
    return { info: data || null, error: null };
  } catch (err) {
    console.warn('[UNIORA] user_info lookup threw:', err);
    return { info: null, error: err };
  }
}