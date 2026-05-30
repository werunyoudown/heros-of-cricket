import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 - attempt token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
