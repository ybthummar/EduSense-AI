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
  searchSubjectVideos: (subject) => api.get('/students/subject-videos', { params: { subject } }),
  getStressAnalysis: () => api.get('/students/stress-analysis'),
  getStudentStress: (studentId) => api.get(`/students/stress-analysis/${studentId}`),
};

// Faculty
export const facultyAPI = {
  getStudents: (facultyId, params = {}) => api.get(`/faculty/${facultyId}/students`, { params }),
  getAnalytics: (facultyId, params = {}) => api.get(`/faculty/${facultyId}/analytics`, { params }),
  addStudent: (data) => api.post('/faculty/add_student', data),
  getStudentsMaster: (params = {}) => api.get('/faculty/students-master', { params }),
  getStudentsPerformance: (params = {}) => api.get('/faculty/students-performance', { params }),
  saveAttendance: (data) => api.post('/faculty/attendance', data),
  addStudentSuggestion: (studentId, suggestion) => api.post(`/faculty/students/${studentId}/suggestions`, suggestion),
  getStudentSuggestions: (studentId) => api.get(`/faculty/students/${studentId}/suggestions`),
  getDashboardAnalytics: (params = {}) => api.get('/faculty/dashboard-analytics', { params }),
  getSubjectMapping: () => api.get('/faculty/subject-mapping'),
};

// Calls
export const callsAPI = {
  getCallMessages: (params = {}) => api.get('/calls', { params }),
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
  getResults: () => api.get('/quizzes/results'),
  seed: () => api.post('/quizzes/seed'),
};

// Pipeline (edit → Raw → Bronze → Silver → Gold)
export const pipelineAPI = {
  editRecord: (data) => api.post('/pipeline/edit', data),
  getRawTables: () => api.get('/pipeline/raw-tables'),
  getLayers: () => api.get('/pipeline/layers'),
};

// Live Attendance (PostgreSQL → Gold pipeline)
export const attendanceAPI = {
  login: (data) => api.post('/attendance/login', data),
  mark: (data) => api.post('/attendance/mark', data),
  getToday: (params = {}) => api.get('/attendance/today', { params }),
  getStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  getHistory: (params = {}) => api.get('/attendance/history', { params }),
  getSummary: (params = {}) => api.get('/attendance/summary', { params }),
};

// Dual-mode AI Chat Assistant (RAG + Gemini LLM)
export const aiChatAPI = {
  query: (data) => api.post('/ai/chat/query', data),
  buildIndex: () => api.post('/ai/chat/build-rag-index'),
};

export default api;
