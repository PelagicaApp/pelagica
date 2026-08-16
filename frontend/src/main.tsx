import { createRoot } from 'react-dom/client';
import { setClientInfo } from '@pelagica/core';
import App from './App.tsx';
import { VERSION } from './utils/version.ts';

import './index.css';
import './theme.css';
import '@pelagica/core/i18n';

setClientInfo({ name: 'Pelagica', version: VERSION });

createRoot(document.getElementById('root')!).render(<App />);
