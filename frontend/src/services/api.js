import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || '/api';
const baseURL = rawBaseURL.replace(/\/+$/, '') + (rawBaseURL.endsWith('/api') ? '' : '/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  timeout: 15_000,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthRequest = request?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || request?._retry || isAuthRequest) {
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
