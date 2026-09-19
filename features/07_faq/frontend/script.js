/* ==========================================================================
   UNIORA PLATFORM - FEATURE 07: FAQ SCRIPT
   File: features/07_faq/frontend/script.js
   ========================================================================== */

import { initNavbarAuth, initActiveNavLink, initNavbarMenu } from '../../../common/js/navbar.js';

const FAQ_DATA_URL = '../../../common/data/faq.json';
const SEARCH_DEBOUNCE_MS = 250;

const state = {
  allFaqs: [],
  filteredFaqs: [],
  openFaqIds: new Set(),
  searchQuery: '',
  isLoading: true,
};

const dom = {
  faqSearchInput: document.getElementById('faqSearchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  faqCount: document.getElementById('faqCount'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  emptyState: document.getElementById('emptyState'),
  emptyResetBtn: document.getElementById('emptyResetBtn'),
  faqAccordion: document.getElementById('faqAccordion'),
  retryBtn: document.getElementById('retryBtn'),
};

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNumber(num) {
  return String(num).padStart(2, '0');
}

/* --------------------------------------------------------------------------
   DATA LOADING
   -------------------------------------------------------------------------- */
async function loadFaqs() {
  showLoadingState();

  try {
    const response = await fetch(FAQ_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.faqs)) {
      throw new Error('Invalid FAQ JSON structure');
    }

    state.allFaqs = data.faqs;
    applySearch();
  } catch (err) {
    console.error('[UNIORA] Failed to load FAQ data:', err);
    showErrorState();
  }
}

/* --------------------------------------------------------------------------
   SEARCH & FILTERING
   -------------------------------------------------------------------------- */
function applySearch() {
  const query = state.searchQuery.trim().toLowerCase();

  if (!query) {
    state.filteredFaqs = [...state.allFaqs];
  } else {
    state.filteredFaqs = state.allFaqs.filter((faq) => {
      const qText = String(faq.question || '').toLowerCase();
      const aText = String(faq.answer || '').toLowerCase();
      const category = String(faq.category || '').toLowerCase();
      return qText.includes(query) || aText.includes(query) || category.includes(query);
    });
  }

  renderResults();
}

function wireSearch() {
  if (!dom.faqSearchInput) return;

  const handleInput = debounce(() => {
    state.searchQuery = dom.faqSearchInput.value;
    if (dom.clearSearchBtn) {
      dom.clearSearchBtn.hidden = !dom.faqSearchInput.value;
    }
    applySearch();
  }, SEARCH_DEBOUNCE_MS);

  dom.faqSearchInput.addEventListener('input', handleInput);

  if (dom.clearSearchBtn) {
    dom.clearSearchBtn.addEventListener('click', () => {
      dom.faqSearchInput.value = '';
      state.searchQuery = '';
      dom.clearSearchBtn.hidden = true;
      applySearch();
      dom.faqSearchInput.focus();
    });
  }

  if (dom.emptyResetBtn) {
    dom.emptyResetBtn.addEventListener('click', () => {
      if (dom.faqSearchInput) dom.faqSearchInput.value = '';
      state.searchQuery = '';
      if (dom.clearSearchBtn) dom.clearSearchBtn.hidden = true;
      applySearch();
    });
  }
}

/* --------------------------------------------------------------------------
   STATE MANAGERS & RENDERING
   -------------------------------------------------------------------------- */
function showLoadingState() {
  state.isLoading = true;
  if (dom.loadingState) dom.loadingState.hidden = false;
  if (dom.errorState) dom.errorState.hidden = true;
  if (dom.emptyState) dom.emptyState.hidden = true;
  if (dom.faqAccordion) dom.faqAccordion.hidden = true;
  if (dom.faqCount) dom.faqCount.textContent = 'Loading frequently asked questions...';
}

function showErrorState() {
  state.isLoading = false;
  if (dom.loadingState) dom.loadingState.hidden = true;
  if (dom.errorState) dom.errorState.hidden = false;
  if (dom.emptyState) dom.emptyState.hidden = true;
  if (dom.faqAccordion) dom.faqAccordion.hidden = true;
  if (dom.faqCount) dom.faqCount.textContent = '';
}

function renderResults() {
  state.isLoading = false;
  if (dom.loadingState) dom.loadingState.hidden = true;
  if (dom.errorState) dom.errorState.hidden = true;

  const totalAll = state.allFaqs.length;
  const totalFiltered = state.filteredFaqs.length;
  const isSearching = state.searchQuery.trim().length > 0;

  if (dom.faqCount) {
    if (!isSearching) {
      dom.faqCount.textContent = `${totalAll} Frequently Asked Questions Available`;
    } else if (totalFiltered > 0) {
      dom.faqCount.textContent = `Found ${totalFiltered} matching question(s) for "${state.searchQuery}"`;
    } else {
      dom.faqCount.textContent = `No matching questions for "${state.searchQuery}"`;
    }
  }

  if (totalFiltered === 0) {
    if (dom.emptyState) dom.emptyState.hidden = false;
    if (dom.faqAccordion) dom.faqAccordion.hidden = true;
    return;
  }

  if (dom.emptyState) dom.emptyState.hidden = true;
  if (dom.faqAccordion) dom.faqAccordion.hidden = false;

  renderAccordion();
}

function renderAccordion() {
  if (!dom.faqAccordion) return;
  dom.faqAccordion.innerHTML = '';

  const fragment = document.createDocumentFragment();

  state.filteredFaqs.forEach((faq, index) => {
    const faqId = faq.id || index + 1;
    const formattedNum = formatNumber(index + 1);
    const isOpen = state.openFaqIds.has(faqId);

    const itemEl = document.createElement('div');
    itemEl.className = `faq-item ${isOpen ? 'open' : ''}`;
    itemEl.dataset.faqId = faqId;

    itemEl.innerHTML = `
      <button
        type="button"
        class="faq-button"
        id="faq-header-${faqId}"
        aria-expanded="${isOpen}"
        aria-controls="faq-answer-${faqId}"
      >
        <span class="faq-number" aria-hidden="true">${formattedNum}</span>
        <h3 class="faq-question">${escapeHtml(faq.question)}</h3>
        <span class="faq-icon-wrapper" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div
        class="faq-answer-container"
        id="faq-answer-${faqId}"
        role="region"
        aria-labelledby="faq-header-${faqId}"
        ${isOpen ? '' : 'hidden'}
      >
        <div class="faq-answer-content">
          <div class="faq-answer">
            <p>${escapeHtml(faq.answer)}</p>
          </div>
        </div>
      </div>
    `;

    const triggerBtn = itemEl.querySelector('.faq-button');
    const answerContainer = itemEl.querySelector('.faq-answer-container');

    if (triggerBtn && answerContainer) {
      triggerBtn.addEventListener('click', () => {
        toggleFaq(faqId, itemEl, triggerBtn, answerContainer);
      });
    }

    fragment.appendChild(itemEl);
  });

  dom.faqAccordion.appendChild(fragment);
}

function toggleFaq(faqId, itemEl, triggerBtn, answerContainer) {
  const isCurrentlyOpen = state.openFaqIds.has(faqId);

  if (isCurrentlyOpen) {
    state.openFaqIds.delete(faqId);
    itemEl.classList.remove('open');
    triggerBtn.setAttribute('aria-expanded', 'false');
    answerContainer.hidden = true;
  } else {
    state.openFaqIds.add(faqId);
    itemEl.classList.add('open');
    triggerBtn.setAttribute('aria-expanded', 'true');
    answerContainer.hidden = false;
  }
}

function wireRetry() {
  if (dom.retryBtn) {
    dom.retryBtn.addEventListener('click', () => loadFaqs());
  }
}

/* --------------------------------------------------------------------------
   INITIALIZATION
   -------------------------------------------------------------------------- */
async function init() {
  wireSearch();
  wireRetry();

  initActiveNavLink();
  initNavbarMenu();
  await initNavbarAuth();
  await loadFaqs();
}

document.addEventListener('DOMContentLoaded', init);
