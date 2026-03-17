import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  // Don't set a global Content-Type. JSON requests will set it automatically,
  // and multipart uploads break if Content-Type is forced to application/json.
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If we're sending FormData, remove any pre-set content-type so the browser can set the boundary.
    const isFormData =
      typeof FormData !== 'undefined' &&
      config.data instanceof FormData;

    if (isFormData) {
      // Axios may normalize headers internally; try both casings.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headers: any = config.headers ?? {};
      delete headers['Content-Type'];
      delete headers['content-type'];
      config.headers = headers;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
