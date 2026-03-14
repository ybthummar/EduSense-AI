import axios from 'axios';

const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edusense_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('edusense_token');
      localStorage.removeItem('edusense_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  createFaculty: (data) => api.post('/admin/create_faculty', data),
};

// Students
export const studentAPI = {
  getDashboard: (studentId) => api.get('/students/dashboard', { params: { student_id: studentId } }),
  getRecommendations: (studentId) => api.get('/students/recommendations', { params: { student_id: studentId } }),
  getProgress: (studentId) => api.get('/students/progress', { params: { student_id: studentId } }),
};

// Faculty
export const facultyAPI = {
  getStudents: (facultyId, params = {}) => api.get(`/faculty/${facultyId}/students`, { params }),
  getAnalytics: (facultyId, params = {}) => api.get(`/faculty/${facultyId}/analytics`, { params }),
  addStudent: (data) => api.post('/faculty/add_student', data),
  getStudentsMaster: (params = {}) => api.get('/faculty/students-master', { params }),
  getStudentsPerformance: (params = {}) => api.get('/faculty/students-performance', { params }),
  saveAttendance: (data) => api.post('/faculty/attendance', data),
};

// Chat
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
};

// Datasets
export const datasetAPI = {
  getStatus: () => api.get('/datasets/status'),
  getData: (key, params = {}) => api.get(`/datasets/${key}`, { params }),
};

// Quizzes
export const quizAPI = {
  create: (data) => api.post('/quizzes/create', data),
  list: (subject) => api.get('/quizzes/list', { params: { subject } }),
  get: (id) => api.get(`/quizzes/${id}`),
  submit: (data) => api.post('/quizzes/submit', data),
  getAttempts: (studentId) => api.get(`/quizzes/attempts/${studentId}`),
};

export default api;
