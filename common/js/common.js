/* ==========================================================================
   UNIORA PLATFORM - COMMON FRONTEND UTILITIES
   File: common/js/common.js
   Reusable DOM, LocalStorage, Query String, and UI Helper Functions
   ========================================================================== */

/**
 * Select a single DOM element
 * @param {string} selector 
 * @param {Element|Document} [parent=document] 
 * @returns {Element|null}
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Select multiple DOM elements as an array
 * @param {string} selector 
 * @param {Element|Document} [parent=document] 
 * @returns {Element[]}
 */
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

/**
 * Show a DOM element
 * @param {Element|string} target 
 * @param {string} [displayStyle='block'] 
 */
export function show(target, displayStyle = 'block') {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.style.display = displayStyle;
}

/**
 * Hide a DOM element
 * @param {Element|string} target 
 */
export function hide(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.style.display = 'none';
}

/**
 * Toggle a CSS class on an element
 * @param {Element|string} target 
 * @param {string} className 
 * @param {boolean} [force] 
 */
export function toggleClass(target, className, force) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.classList.toggle(className, force);
}

/**
 * Safely set text content of an element to prevent XSS
 * @param {Element|string} target 
 * @param {string} text 
 */
export function setText(target, text) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.textContent = text || '';
}

/**
 * Local Storage Helper: Save item safely
 * @param {string} key 
 * @param {any} value 
 */
export function storageSet(key, value) {
  try {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(`uniora_${key}`, serialized);
  } catch (e) {
    // Storage quota exceeded or disabled
  }
}

/**
 * Local Storage Helper: Get item safely
 * @param {string} key 
 * @param {any} [defaultValue=null] 
 * @returns {any}
 */
export function storageGet(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(`uniora_${key}`);
    if (item === null) return defaultValue;
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch {
    return defaultValue;
  }
}

/**
 * Local Storage Helper: Remove item
 * @param {string} key 
 */
export function storageRemove(key) {
  try {
    localStorage.removeItem(`uniora_${key}`);
  } catch (e) {}
}

/**
 * Generic button loading state helper
 * @param {Element|string} button 
 * @param {boolean} isLoading 
 * @param {string} [loadingText='Loading...'] 
 */
export function setLoadingState(button, isLoading, loadingText = 'Loading...') {
  const btn = typeof button === 'string' ? $(button) : button;
  if (!btn) return;

  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add('btn-disabled');
    btn.textContent = loadingText;
  } else {
    btn.disabled = false;
    btn.classList.remove('btn-disabled');
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

/**
 * Debounce utility function
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(func, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Get query parameter value from URL
 * @param {string} param 
 * @returns {string|null}
 */
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Basic Date formatter (DD MMM YYYY)
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}