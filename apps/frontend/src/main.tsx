import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
// Fonts are bundled (no Google Fonts request), so the app looks the same offline.
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/crimson-pro/400.css';
import '@fontsource/crimson-pro/500.css';
import '@fontsource/crimson-pro/600.css';
import '@fontsource/crimson-pro/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
