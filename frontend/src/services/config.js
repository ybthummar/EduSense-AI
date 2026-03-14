export const API_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api');
export const APP_NAME = 'EduSense AI';
export const ROLES = { ADMIN: 'admin', FACULTY: 'faculty', STUDENT: 'student' };
