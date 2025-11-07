import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.125.121.213:8080/api',
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Network Error';
    console.error('[API ERROR]', msg, err?.response?.data);
    return Promise.reject(new Error(msg));
  }
);
