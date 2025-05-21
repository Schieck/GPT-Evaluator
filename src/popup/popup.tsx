import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import App from './App';

// Prevent popup from closing when clicking outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const popup = document.querySelector('.popup-container');
    if (popup && !popup.contains(event.target as Node)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
