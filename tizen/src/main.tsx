import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init } from '@noriginmedia/norigin-spatial-navigation';
import { initTvStatsCollector, setClientInfo } from '@pelagica/core';
import { initGamepadNavigation, tizenNavigationAdapter } from '@pelagica/tv-platform';
import App from '@pelagica/tv-frontend';
import pkg from '../package.json' with { type: 'json' };

import '@pelagica/core/i18n';
import '@pelagica/tv-frontend/index.css';
import '@pelagica/tv-frontend/theme.css';

init();
initGamepadNavigation();
tizenNavigationAdapter.init();
setClientInfo({ name: 'Pelagica Tizen', version: pkg.version, platform: 'tizen' });
initTvStatsCollector();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
