import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.88)',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              borderRadius: '12px',
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
