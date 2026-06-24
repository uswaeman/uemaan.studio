import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const redirectPath = new URLSearchParams(window.location.search).get('p');

if (redirectPath) {
  const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
  window.history.replaceState(null, '', normalizedPath);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
