/**
 * Unified product analytics — Google Analytics 4 + Mixpanel.
 *
 * Enabled via environment variables:
 *   VITE_GA_MEASUREMENT_ID  — GA4 measurement ID (e.g. "G-XXXXXXXXXX")
 *   VITE_MIXPANEL_TOKEN     — Mixpanel project token
 *
 * Both are optional; the module gracefully no-ops when a provider is unconfigured.
 * Mixpanel is loaded via dynamic import so the build succeeds even if
 * mixpanel-browser is not installed.
 * Respects cookie consent — analytics only fire when the user has accepted the
 * "analytics" category in the cookie consent banner (localStorage key: ems_cookie_consent).
 */
import { safeGetItem } from '../utils/safeStorage';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || '';
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN?.trim() || '';

let ga4Ready = false;
let mixpanelReady = false;

// Mixpanel SDK reference — loaded lazily via dynamic import in initMixpanel()
let mixpanel = null;

// ---------------------------------------------------------------------------
// Cookie consent check
// ---------------------------------------------------------------------------
const CONSENT_KEY = 'ems_cookie_consent';

function hasAnalyticsConsent() {
  try {
    const raw = safeGetItem(CONSENT_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent.analytics === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function initGA4() {
  if (!GA_MEASUREMENT_ID) return;

  // Load gtag.js dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // Disable automatic page_view — we send them manually on route changes
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  ga4Ready = true;
}

async function initMixpanel() {
  if (!MIXPANEL_TOKEN) return;

  try {
    // Dynamic import so the build doesn't fail when mixpanel-browser is not installed
    const mod = await import('mixpanel-browser');
    mixpanel = mod.default || mod;
    mixpanel.init(MIXPANEL_TOKEN, {
      track_pageview: false, // we track manually
      persistence: 'localStorage',
    });
    mixpanelReady = true;
  } catch {
    // mixpanel-browser not installed or init failed — non-fatal
  }
}

/**
 * Call once at app bootstrap (before React renders).
 * Only loads analytics scripts if the user has accepted analytics cookies.
 */
export function initAnalytics() {
  if (!hasAnalyticsConsent()) return;

  initGA4();
  initMixpanel();
}

// ---------------------------------------------------------------------------
// Page views
// ---------------------------------------------------------------------------

/** Track a virtual page view (SPA route change). */
export function trackPageView(path, title) {
  if (!hasAnalyticsConsent()) return;

  const pageTitle = title || document.title;

  if (ga4Ready && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle,
    });
  }

  if (mixpanelReady && mixpanel) {
    mixpanel.track('Page View', { path, title: pageTitle });
  }
}

// ---------------------------------------------------------------------------
// Custom events
// ---------------------------------------------------------------------------

/** Track a custom event (e.g. "student_created", "fee_paid"). */
export function trackEvent(eventName, properties = {}) {
  if (!hasAnalyticsConsent()) return;

  if (ga4Ready && window.gtag) {
    window.gtag('event', eventName, properties);
  }

  if (mixpanelReady && mixpanel) {
    mixpanel.track(eventName, properties);
  }
}

// ---------------------------------------------------------------------------
// User identification
// ---------------------------------------------------------------------------

/** Identify the current user after login (never send PII to GA4). */
export function identifyUser(user) {
  if (!user || !hasAnalyticsConsent()) return;

  if (ga4Ready && window.gtag) {
    window.gtag('set', { user_id: user.id });
    window.gtag('set', 'user_properties', {
      user_role: user.role,
    });
  }

  if (mixpanelReady && mixpanel) {
    mixpanel.identify(user.id);
    mixpanel.people.set({
      role: user.role,
    });
  }
}

/** Reset analytics state on logout. */
export function resetAnalytics() {
  if (mixpanelReady && mixpanel) {
    mixpanel.reset();
  }
}
