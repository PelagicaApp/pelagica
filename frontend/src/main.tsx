import { createRoot } from 'react-dom/client';
import { setClientInfo } from '@pelagica/core';
import App from './App.tsx';
import { isDesktopBuild } from './utils/desktopApp.ts';
import { VERSION } from './utils/version.ts';

import './index.css';
import './theme.css';
import '@pelagica/core/i18n';

if (isDesktopBuild) {
    setClientInfo({ name: 'Pelagica Desktop', version: VERSION, platform: 'desktop' });
} else {
    setClientInfo({ name: 'Pelagica', version: VERSION });
}

createRoot(document.getElementById('root')!).render(<App />);
