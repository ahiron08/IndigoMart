import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || '/api';
const trimmedBaseURL = rawBaseURL.replace(/\/+$/, '');
const baseURL = trimmedBaseURL.endsWith('/api') ? trimmedBaseURL : `${trimmedBaseURL}/api`;

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[IndigoMart] VITE_API_URL is not set. API requests will use the relative "/api" path. ' +
      'If the backend is on a different domain, set VITE_API_URL in your Vercel environment variables.',
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  timeout: 15_000,
});

let refreshPromise = null;

// URLs that should NOT trigger a token refresh when they return 401.
// /auth/me is intentionally excluded so that an expired access token can be
// silently refreshed when restoring the session.
const skipRefreshPatterns = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];

const shouldSkipRefresh = (url) => {
  if (!url) return false;
  return skipRefreshPatterns.some((pattern) => url.includes(pattern));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;

    if (error.response?.status !== 401 || request?._retry || shouldSkipRefresh(request?.url)) {
      return Promise.reject(error);
    }

    request._retry = true;
    refreshPromise ??= axios
      .post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
      .finally(() => {
        refreshPromise = null;
      });

    try {
      await refreshPromise;
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
