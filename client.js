import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const storage = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set(tokens) {
    if (tokens.accessToken) localStorage.setItem('accessToken', tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
  },
  clear() {
    ['accessToken', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k));
  },
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (storage.access) config.headers.Authorization = `Bearer ${storage.access}`;
  return config;
});

// When an access token expires, get a new pair with the refresh token and retry once.
let refreshing = null;
export function refreshTokens() {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/auth/refresh`, { refreshToken: storage.refresh })
      .then((res) => { storage.set(res.data.data); return res.data.data; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

let onAuthFailure = () => {};
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !isAuthCall && storage.refresh) {
      original._retry = true;
      try {
        const tokens = await refreshTokens();
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch (refreshError) {
        storage.clear();
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  }
);

// Turns any axios error into a readable message (including per-field validation errors).
export function getErrorMessage(error) {
  const data = error.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => e.message).join('. ');
  if (data?.message) return data.message;
  if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  return error.message || 'Something went wrong';
}

export default api;
