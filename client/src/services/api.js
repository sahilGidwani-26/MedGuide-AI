import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medguide_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medguide_token');
      localStorage.removeItem('medguide_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// ─── User ────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  saveHospital: (data) => api.post('/users/saved-hospitals', data),
  getSavedHospitals: () => api.get('/users/saved-hospitals'),
  removeSavedHospital: (index) => api.delete(`/users/saved-hospitals/${index}`),
  updateFcmToken: (token) => api.put('/users/fcm-token', { fcmToken: token }),
};

// ─── Symptoms ────────────────────────────
export const symptomAPI = {
  analyze: (data) => api.post('/symptoms/analyze', data),
  getHistory: (params) => api.get('/symptoms/history', { params }),
  getOne: (id) => api.get(`/symptoms/${id}`),
  delete: (id) => api.delete(`/symptoms/${id}`),
};

// ─── Hospitals ───────────────────────────
export const hospitalAPI = {
  getNearby: (params) => api.get('/hospitals/nearby', { params }),
  getEmergency: (params) => api.get('/hospitals/emergency', { params }),
};

// ─── Chat ─────────────────────────────────
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getHistory: () => api.get('/chat/history'),
  getSession: (id) => api.get(`/chat/${id}`),
  deleteSession: (id) => api.delete(`/chat/${id}`),
};

// ─── Reports ─────────────────────────────
export const reportAPI = {
  upload: (formData) => api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/reports', { params }),
  getOne: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ─── Doctors ─────────────────────────────
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getOne: (id) => api.get(`/doctors/${id}`),
  getSpecializations: () => api.get('/doctors/specializations'),
};

// ─── Admin ───────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getAllSymptoms: (params) => api.get('/admin/symptoms', { params }),
};

export default api;
