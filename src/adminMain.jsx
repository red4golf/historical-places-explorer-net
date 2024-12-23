import React from 'react';
import ReactDOM from 'react-dom/client';
import Admin from './components/Admin';
import Providers from './providers';
import './index.css';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Providers>
          <Admin />
        </Providers>
      </React.StrictMode>
    );
  } else {
    console.error('Root element not found');
  }
});