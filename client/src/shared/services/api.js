const DEFAULT_HOST = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const ENV_API_URL = import.meta.env?.VITE_API_BASE_URL;

const PORTS_TO_PROBE = [5008, 5007, 5006, 5005, 5004, 5003, 5002, 5001, 5000];
let cachedActiveApiBaseUrl = ENV_API_URL || (typeof localStorage !== 'undefined' ? localStorage.setItem : null);

let activePortPromise = null;

export const getActiveApiUrl = async () => {
  if (cachedActiveApiBaseUrl && typeof cachedActiveApiBaseUrl === 'string') {
    return cachedActiveApiBaseUrl;
  }

  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('campusbridge_active_api_url') : null;
  if (saved) {
    try {
      const res = await fetch(`${saved}/health`, { signal: AbortSignal.timeout(200) });
      if (res.ok) {
        cachedActiveApiBaseUrl = saved;
        return saved;
      }
    } catch (e) {
      // Saved port offline, probe in parallel
    }
  }

  if (!activePortPromise) {
    activePortPromise = (async () => {
      const probePromises = PORTS_TO_PROBE.map(async (port) => {
        const url = `http://${DEFAULT_HOST}:${port}/api/v1`;
        try {
          const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(300) });
          if (res.ok) return url;
        } catch {}
        throw new Error(`Port ${port} unavailable`);
      });

      try {
        const workingUrl = await Promise.any(probePromises);
        cachedActiveApiBaseUrl = workingUrl;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('campusbridge_active_api_url', workingUrl);
        }
        return workingUrl;
      } catch (err) {
        const fallbackUrl = `http://${DEFAULT_HOST}:5001/api/v1`;
        cachedActiveApiBaseUrl = fallbackUrl;
        return fallbackUrl;
      }
    })();
  }

  return await activePortPromise;
};

export const getApiOrigin = () => {
  const base = cachedActiveApiBaseUrl || `http://${DEFAULT_HOST}:5001/api/v1`;
  return base.replace(/\/api\/v1\/?$/, '');
};

export const getAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = getApiOrigin();
  if (url.startsWith('/')) return `${origin}${url}`;
  return `${origin}/${url}`;
};

export const apiClient = async (endpoint, options = {}) => {
  const baseUrl = await getActiveApiUrl();
  const token = localStorage.getItem('campusbridge_token');

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response = null;

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    // If request failed, clear cached port and retry once with fresh port detection
    cachedActiveApiBaseUrl = null;
    activePortPromise = null;
    const freshUrl = await getActiveApiUrl();
    response = await fetch(`${freshUrl}${endpoint}`, {
      ...options,
      headers
    });
  }

  if (!response) {
    throw new Error('Unable to connect to CampusBridge backend server. Please verify backend is running.');
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Server returned non-JSON error (${response.status}) from endpoint '${endpoint}'`);
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};
