const DEFAULT_HOST = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const ENV_API_URL = import.meta.env?.VITE_API_BASE_URL;

const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
const RENDER_PROD_API_URL = 'https://alumni-platform-pv27.onrender.com/api/v1';

const PORTS_TO_PROBE = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5010, 5012, 5015, 5020];

let cachedActiveApiBaseUrl = (() => {
  if (ENV_API_URL && (IS_HTTPS ? ENV_API_URL.startsWith('https://') : true)) {
    return ENV_API_URL;
  }
  if (IS_HTTPS) {
    return RENDER_PROD_API_URL;
  }
  return null;
})();

let activePortPromise = null;

export const getActiveApiUrl = async (forceRefresh = false) => {
  if (!forceRefresh && cachedActiveApiBaseUrl && typeof cachedActiveApiBaseUrl === 'string') {
    return cachedActiveApiBaseUrl;
  }

  if (IS_HTTPS) {
    cachedActiveApiBaseUrl = (ENV_API_URL && ENV_API_URL.startsWith('https://')) ? ENV_API_URL : RENDER_PROD_API_URL;
    return cachedActiveApiBaseUrl;
  }

  if (!forceRefresh) {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('campusbridge_active_api_url') : null;
    if (saved && !saved.startsWith('http://')) {
      try {
        const res = await fetch(`${saved}/health`, { signal: AbortSignal.timeout(300) });
        if (res.ok) {
          const data = await res.json();
          if (data.service?.includes('CampusBridge')) {
            cachedActiveApiBaseUrl = saved;
            return saved;
          }
        }
      } catch (e) {
        // Saved port offline or stale
      }
    }
  }

  activePortPromise = (async () => {
    for (const port of PORTS_TO_PROBE) {
      const url = `http://${DEFAULT_HOST}:${port}/api/v1`;
      try {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(250) });
        if (res.ok) {
          const data = await res.json();
          if (data.service?.includes('CampusBridge')) {
            cachedActiveApiBaseUrl = url;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('campusbridge_active_api_url', url);
            }
            return url;
          }
        }
      } catch (e) {
        // Continue to next port
      }
    }

    const fallbackUrl = `http://${DEFAULT_HOST}:5001/api/v1`;
    cachedActiveApiBaseUrl = fallbackUrl;
    return fallbackUrl;
  })();

  return await activePortPromise;
};

export const getApiOrigin = () => {
  const base = cachedActiveApiBaseUrl || (IS_HTTPS ? RENDER_PROD_API_URL : `http://${DEFAULT_HOST}:5001/api/v1`);
  return base.replace(/\/api\/v1\/?$/, '');
};

export const getAssetUrl = (pathStr) => {
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:')) {
    return pathStr;
  }
  const origin = getApiOrigin();
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
  return `${origin}${cleanPath}`;
};

export const apiClient = async (endpoint, options = {}) => {
  let baseUrl = await getActiveApiUrl();
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('campusbridge_token') : null;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };
  if (isFormData) {
    delete headers['Content-Type'];
  }

  // Normalize endpoint to always include /api/v1 prefix cleanly
  let rawEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (rawEndpoint.startsWith('/api/v1')) {
    rawEndpoint = rawEndpoint.replace('/api/v1', '');
  }

  const rootOrigin = getApiOrigin();
  const fullUrl = `${rootOrigin}/api/v1${rawEndpoint}`;

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers
    });
  } catch (netErr) {
    // Port failed/changed: clear cache, force refresh discovery, and retry request
    cachedActiveApiBaseUrl = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('campusbridge_active_api_url');
    }
    const freshBaseUrl = await getActiveApiUrl(true);
    const freshOrigin = freshBaseUrl.replace(/\/api\/v1\/?$/, '');
    response = await fetch(`${freshOrigin}/api/v1${rawEndpoint}`, {
      ...options,
      headers
    });
  }

  // If request returned 404 non-JSON, re-verify port and retry once
  if (response.status === 404) {
    const textPreview = await response.clone().text();
    if (textPreview.includes('<!DOCTYPE html>') || textPreview.includes('Cannot POST') || textPreview.includes('Cannot GET')) {
      cachedActiveApiBaseUrl = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('campusbridge_active_api_url');
      }
      const freshBaseUrl = await getActiveApiUrl(true);
      const freshOrigin = freshBaseUrl.replace(/\/api\/v1\/?$/, '');
      if (`${freshOrigin}/api/v1` !== baseUrl) {
        response = await fetch(`${freshOrigin}/api/v1${rawEndpoint}`, {
          ...options,
          headers
        });
      }
    }
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const rawText = await response.text();
    throw new Error(
      `Server returned non-JSON error (${response.status}) from endpoint '${endpoint}': ${rawText.slice(0, 150)}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred while communicating with the server');
  }

  return data;
};
