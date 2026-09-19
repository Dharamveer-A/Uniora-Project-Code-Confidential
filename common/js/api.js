/* ==========================================================================
   UNIORA PLATFORM - SHARED FRONTEND API COMMUNICATION LAYER
   File: common/js/api.js
   Handles HTTP requests (GET, POST, PUT, DELETE, Uploads) to FastAPI Backend
   ========================================================================== */

import { getCurrentSession } from './auth.js';

// Configurable API Base URL for FastAPI Backend
const API_BASE_URL = window.ENV?.API_BASE_URL || 'http://localhost:8000/api';

/**
 * Base HTTP request helper
 * @param {string} endpoint API endpoint path (e.g. '/schemes')
 * @param {Object} options Fetch request options (method, headers, body, auth)
 * @returns {Promise<{data: any, error: any, status: number}>}
 */
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    requiresAuth = true,
    isFormData = false
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const requestHeaders = { ...headers };

  // Set Content-Type for JSON (do NOT set for FormData)
  if (!isFormData && body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Attach Supabase JWT Authorization Token if required
  if (requiresAuth) {
    const session = await getCurrentSession();
    if (session?.access_token) {
      requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  try {
    const fetchOptions = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type');
    let responseData = null;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      return {
        data: null,
        error: responseData?.detail || responseData || 'API Request Failed',
        status: response.status
      };
    }

    return {
      data: responseData,
      error: null,
      status: response.status
    };
  } catch (err) {
    return {
      data: null,
      error: err.message || 'Network communication error',
      status: 0
    };
  }
}

/**
 * GET HTTP Request
 * @param {string} endpoint 
 * @param {Object} [options={}] 
 */
export async function apiGet(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'GET' });
}

/**
 * POST HTTP Request
 * @param {string} endpoint 
 * @param {Object} body 
 * @param {Object} [options={}] 
 */
export async function apiPost(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT HTTP Request
 * @param {string} endpoint 
 * @param {Object} body 
 * @param {Object} [options={}] 
 */
export async function apiPut(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE HTTP Request
 * @param {string} endpoint 
 * @param {Object} [options={}] 
 */
export async function apiDelete(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Multipart FormData Upload HTTP Request (Documents, Files)
 * @param {string} endpoint 
 * @param {FormData} formData 
 * @param {Object} [options={}] 
 */
export async function apiUpload(endpoint, formData, options = {}) {
  return request(endpoint, {
    ...options,
    method: 'POST',
    body: formData,
    isFormData: true
  });
}