/* ==========================================================================
   UNIORA PLATFORM — COMMON NAVBAR MODULE
   File: common/js/navbar.js
   ========================================================================== */

import { supabase } from './supabase.js';
import { getCurrentUser, onAuthStateChange } from './auth.js';

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const MOBILE_BREAKPOINT = '(max-width: 768px)';

let authListenerInitialized = false;
let authRenderSequence = 0;

/* ==========================================================================
   ACTIVE PAGE HIGHLIGHTER
   ========================================================================== */

export function initActiveNavLink() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.navbar-link');

  if (!navLinks.length) return;

  navLinks.forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
  });

  const pageMap = [
    {
      page: 'dashboard',
      matches: ['/dashboard/', '/dashboard']
    },
    {
      page: 'schemes',
      matches: ['01_scheme_recommendation']
    },
    {
      page: 'documents',
      matches: ['03_documents_verification']
    },
    {
      page: 'eligible',
      matches: ['04_eligible_schemes']
    },
    {
      page: 'readiness',
      matches: ['05_my_readiness']
    },
    {
      page: 'services',
      matches: ['06_government_services']
    },
    {
      page: 'ask',
      matches: ['02_ask_uniora']
    }
  ];

  let matchedPage = null;

  for (const item of pageMap) {
    const isMatch = item.matches.some(match => {
      if (
        match === '/dashboard' ||
        match === '/dashboard/'
      ) {
        return (
          currentPath === '/dashboard' ||
          currentPath === '/dashboard/' ||
          currentPath.endsWith('/dashboard/index.html')
        );
      }

      return currentPath.includes(match);
    });

    if (isMatch) {
      matchedPage = item.page;
      break;
    }
  }

  if (matchedPage) {
    const activeLink = document.querySelector(
      `.navbar-link[data-page="${matchedPage}"]`
    );

    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('aria-current', 'page');
    }

    return;
  }

  /*
    Fallback matching for any page not explicitly included
    in the page map.
  */
  navLinks.forEach(link => {
    const href = link.getAttribute('href');

    if (!href) return;

    const normalizedHref = href.toLowerCase().split('?')[0];

    if (
      currentPath === normalizedHref ||
      currentPath.endsWith(normalizedHref)
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ==========================================================================
   USER DISPLAY HELPERS
   ========================================================================== */

export function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function getMetadataDisplayName(user) {
  if (!user) {
    return 'Citizen';
  }

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Citizen'
  );
}

async function getDisplayName(user) {
  const fallbackName = getMetadataDisplayName(user);

  if (!user || !supabase || !user.id) {
    return fallbackName;
  }

  try {
    const { data: profile, error } = await supabase
      .from('user_profile')
      .select('name, email, avatar_url')
      .eq('uid', user.id)
      .maybeSingle();

    if (!error && profile?.name) {
      return profile.name;
    }
  } catch (error) {
    console.warn(
      '[UNIORA Navbar] USER_PROFILE lookup failed:',
      error
    );
  }

  return fallbackName;
}

/* ==========================================================================
   CACHED SESSION USER
   ========================================================================== */

function getCachedSessionUser() {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (
        !key ||
        !key.startsWith('sb-') ||
        !key.endsWith('-auth-token')
      ) {
        continue;
      }

      const rawSession = localStorage.getItem(key);

      if (!rawSession) {
        continue;
      }

      const parsedSession = JSON.parse(rawSession);

      if (parsedSession?.user) {
        return parsedSession.user;
      }
    }
  } catch (error) {
    console.warn(
      '[UNIORA Navbar] Cached session could not be read:',
      error
    );
  }

  return null;
}

/* ==========================================================================
   NAVBAR AUTHENTICATION STATE
   ========================================================================== */

function updateNavbarIdentity(user) {
  const navbarUserName = document.getElementById('navbarUserName');
  const navbarAvatar = document.getElementById('navbarAvatar');

  const displayName = getMetadataDisplayName(user);

  if (navbarUserName) {
    navbarUserName.textContent = displayName;
  }

  if (navbarAvatar) {
    navbarAvatar.textContent = getInitials(displayName);
  }
}

function showAuthenticatedNavbarState() {
  const navbarUser = document.getElementById('navbarUser');
  const navbarLogin = document.getElementById('navbarLogin');

  if (navbarLogin) {
    navbarLogin.hidden = true;
  }

  if (navbarUser) {
    navbarUser.hidden = false;
  }
}

function showGuestNavbarState() {
  const navbarUser = document.getElementById('navbarUser');
  const navbarLogin = document.getElementById('navbarLogin');

  if (navbarUser) {
    navbarUser.hidden = true;
  }

  if (navbarLogin) {
    navbarLogin.hidden = false;
  }
}

function finishNavbarAuthLoading() {
  const navbarAuth = document.getElementById('navbarAuth');

  if (navbarAuth) {
    navbarAuth.classList.remove('is-loading');
  }
}

export async function renderNavbarState(user) {
  const navbarAuth = document.getElementById('navbarAuth');
  const navbarUser = document.getElementById('navbarUser');
  const navbarLogin = document.getElementById('navbarLogin');

  if (!navbarAuth || !navbarUser || !navbarLogin) {
    return;
  }

  const renderId = ++authRenderSequence;

  if (user) {
    /*
      Render the cached metadata immediately to prevent visible flickering.
    */
    updateNavbarIdentity(user);
    showAuthenticatedNavbarState();
    finishNavbarAuthLoading();

    /*
      Fetch the preferred display name in the background.
      Ignore stale requests when authentication changes quickly.
    */
    const profileDisplayName = await getDisplayName(user);

    if (renderId !== authRenderSequence) {
      return;
    }

    const navbarUserName = document.getElementById('navbarUserName');
    const navbarAvatar = document.getElementById('navbarAvatar');

    if (navbarUserName) {
      navbarUserName.textContent = profileDisplayName;
    }

    if (navbarAvatar) {
      navbarAvatar.textContent = getInitials(profileDisplayName);
    }

    return;
  }

  showGuestNavbarState();
  finishNavbarAuthLoading();
}

/* ==========================================================================
   AUTHENTICATION INITIALIZATION
   ========================================================================== */

export async function initNavbarAuth() {
  const navbarAuth = document.getElementById('navbarAuth');

  if (!navbarAuth) {
    return;
  }

  /*
    Prevent duplicate initialization when both the common navbar loader
    and a page-level script initialize authentication.
  */
  if (navbarAuth.dataset.authInitialized === 'true') {
    return;
  }

  navbarAuth.dataset.authInitialized = 'true';
  navbarAuth.classList.add('is-loading');

  try {
    /*
      Render the locally cached user immediately.
    */
    const cachedUser = getCachedSessionUser();

    if (cachedUser) {
      void renderNavbarState(cachedUser);
    }

    /*
      Confirm the current state with Supabase.
    */
    const currentUser = await getCurrentUser();

    await renderNavbarState(currentUser);

    /*
      Register the auth listener only once.
    */
    if (authListenerInitialized) {
      return;
    }

    authListenerInitialized = true;

    onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }

      const nextUser = session?.user || null;

      void renderNavbarState(nextUser);
    });

  } catch (error) {
    console.warn(
      '[UNIORA Navbar] Authentication initialization failed:',
      error
    );

    await renderNavbarState(null);
  }
}

/* ==========================================================================
   MOBILE DRAWER CONTROLLER
   ========================================================================== */

export function initNavbarMenu() {
  const toggle = document.getElementById('navbarToggle');
  const menu = document.getElementById('navbarMenu');
  const overlay = document.getElementById('navbarOverlay');

  if (!toggle || !menu || !overlay) {
    return;
  }

  /*
    Prevent duplicate click handlers.
  */
  if (toggle.dataset.menuInitialized === 'true') {
    return;
  }

  toggle.dataset.menuInitialized = 'true';

  let previousBodyOverflow = '';

  const isOpen = () => {
    return menu.classList.contains('is-open');
  };

  const isMobileViewport = () => {
    return window.matchMedia(MOBILE_BREAKPOINT).matches;
  };

  const openMenu = () => {
    if (!isMobileViewport()) {
      return;
    }

    menu.classList.add('is-open');
    overlay.classList.add('is-open');
    toggle.classList.add('is-open');

    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');

    overlay.setAttribute('aria-hidden', 'false');

    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    menu.classList.remove('is-open');
    overlay.classList.remove('is-open');
    toggle.classList.remove('is-open');

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');

    overlay.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = previousBodyOverflow;
  };

  toggle.addEventListener('click', () => {
    if (isOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) {
      closeMenu();
      toggle.focus();
    }
  });

  menu.querySelectorAll('.navbar-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  const mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);

  const handleBreakpointChange = event => {
    if (!event.matches && isOpen()) {
      closeMenu();
    }
  };

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener(
      'change',
      handleBreakpointChange
    );
  } else {
    mobileQuery.addListener(handleBreakpointChange);
  }
}

/* ==========================================================================
   AUTO-INITIALIZATION
   ========================================================================== */

function setupNavbar() {
  initActiveNavLink();
  initNavbarMenu();
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    setupNavbar,
    { once: true }
  );
} else {
  setupNavbar();
}