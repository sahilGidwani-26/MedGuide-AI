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

export const medicineAPI = {
  // Image scan
  scan: (formData) => api.post('/medicine/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Text search
  searchByName: (medicineName) => api.post('/medicine/scan', { medicineName }),
  // Drug interaction check
  checkInteraction: (medicines) => api.post('/medicine/interaction', { medicines }),
};

export const vitalsAPI = {
  // Sab records lao (last N days)
  getAll: (days = 90) => api.get('/vitals', { params: { days } }),
 
  // Naya vital log karo
  log: (data) => api.post('/vitals', data),
 
  // Record delete karo
  delete: (id) => api.delete(`/vitals/${id}`),
 
  // AI health summary
  getSummary: () => api.get('/vitals/summary'),
};


export const mentalHealthAPI = {
  // ── Full data (all tabs history) ──────────────────────────
  getData:    ()           => api.get('/mental-health'),
  getSummary: ()           => api.get('/mental-health/summary'),
 
  // ── Mood ──────────────────────────────────────────────────
  logMood:    (data)       => api.post  ('/mental-health/mood', data),
  clearMoods: ()           => api.delete('/mental-health/mood'),
 
  // ── Stress ────────────────────────────────────────────────
  logStress:   (data)      => api.post  ('/mental-health/stress', data),
  clearStress: ()          => api.delete('/mental-health/stress'),
 
  // ── Breathing ─────────────────────────────────────────────
  logBreathing:   (data)   => api.post  ('/mental-health/breathing', data),
  clearBreathing: ()       => api.delete('/mental-health/breathing'),
 
  // ── PHQ-9 ─────────────────────────────────────────────────
  logPhq9:   (data)        => api.post  ('/mental-health/phq9', data),
  clearPhq9: ()            => api.delete('/mental-health/phq9'),
 
  // ── AI Chat ───────────────────────────────────────────────
  sendMessage: (message)   => api.post  ('/mental-health/chat', { message }),
  clearChat:   ()          => api.delete('/mental-health/chat'),
};


// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE EXPORTS TO YOUR EXISTING src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────

// ─── Medicine Reminders ───────────────────────────────────────
export const medicineReminderAPI = {
  getAll:        ()           => api.get('/medicine-reminders'),
  getOne:        (id)         => api.get(`/medicine-reminders/${id}`),
  create:        (data)       => api.post('/medicine-reminders', data),
  update:        (id, data)   => api.put(`/medicine-reminders/${id}`, data),
  delete:        (id)         => api.delete(`/medicine-reminders/${id}`),
  logDose:       (id, data)   => api.post(`/medicine-reminders/${id}/dose`, data),
  getAdherence:  ()           => api.get('/medicine-reminders/stats/adherence'),
};

// ─── Blood Donor ──────────────────────────────────────────────
export const bloodAPI = {
  // Donor profile
  getMyProfile:       ()       => api.get('/blood/donor/me'),
  registerDonor:      (data)   => api.post('/blood/donor/register', data),
  toggleAvailability: ()       => api.patch('/blood/donor/availability'),

  // Search donors
  searchDonors: (params) => api.get('/blood/donors/search', { params }),
  // params: { bloodGroup?, city?, lat?, lng?, radius? }

  // Requests
  getRequests:    (params) => api.get('/blood/requests', { params }),
  getMyRequests:  ()       => api.get('/blood/requests/mine'),
  createRequest:  (data)   => api.post('/blood/requests', data),
  respondRequest: (id)     => api.post(`/blood/requests/${id}/respond`),
  updateStatus:   (id, status) => api.patch(`/blood/requests/${id}/status`, { status }),
};
 

export default api;
