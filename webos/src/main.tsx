import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init } from '@noriginmedia/norigin-spatial-navigation';
import { setClientInfo } from '@pelagica/core';
import { getNavigationAdapter, initGamepadNavigation } from '@pelagica/tv-platform';
import App from '@pelagica/tv-frontend';
import pkg from '../package.json' with { type: 'json' };

import '@pelagica/core/i18n';
import '@pelagica/tv-frontend/index.css';
import '@pelagica/tv-frontend/theme.css';

init();
initGamepadNavigation();
setClientInfo({ name: 'Pelagica webOS', version: pkg.version, platform: 'webos' });
getNavigationAdapter().init();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
