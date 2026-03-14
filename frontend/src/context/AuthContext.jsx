import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('edusense_user');
    const token = localStorage.getItem('edusense_token');
    if (savedUser && token) {
      try { setUser(JSON.parse(savedUser)); } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('edusense_token', data.access_token);
    localStorage.setItem('edusense_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password) => {
    await authAPI.signup({ name, email, password, role: 'student' });
  };

  const logout = () => {
    localStorage.removeItem('edusense_token');
    localStorage.removeItem('edusense_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
