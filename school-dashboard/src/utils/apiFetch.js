import { clearStoredUser } from './authSession';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_BASE_URL = new URL(API_BASE, window.location.origin);

function isRelativeApiPath(url) {
  return url.origin === window.location.origin && url.pathname.startsWith('/api/');
}

function isConfiguredApiPath(url) {
  return url.origin === API_BASE_URL.origin && url.pathname.startsWith(API_BASE_URL.pathname);
}

function isApiRequest(url) {
  return isRelativeApiPath(url) || isConfiguredApiPath(url);
}

function normalizeApiUrl(url) {
  if (isRelativeApiPath(url)) {
    return new URL(`${url.pathname}${url.search}${url.hash}`, API_BASE_URL.origin).toString();
  }

  return url.toString();
}

function sanitizeHeaders(headersLike) {
  const headers = new Headers(headersLike || {});
  const authorization = headers.get('Authorization');

  if (authorization && /^Bearer(?:\s+(?:null|undefined))?\s*$/i.test(authorization)) {
    headers.delete('Authorization');
  }

  return headers;
}

export function installApiFetchDefaults() {
  if (window.__emsApiFetchInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.__emsApiFetchInstalled = true;

  window.fetch = async (input, init = {}) => {
    const inputUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input?.url;

    if (!inputUrl) {
      return originalFetch(input, init);
    }

    const resolvedUrl = new URL(inputUrl, window.location.origin);
    if (!isApiRequest(resolvedUrl)) {
      return originalFetch(input, init);
    }

    const requestHeaders = sanitizeHeaders(init.headers ?? (input instanceof Request ? input.headers : undefined));
    const response = await originalFetch(normalizeApiUrl(resolvedUrl), {
      ...init,
      headers: requestHeaders,
      credentials: init.credentials ?? 'include',
    });

    if (response.status === 401) {
      clearStoredUser();
    }

    return response;
  };
}
