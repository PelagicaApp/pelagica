import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { init } from '@noriginmedia/norigin-spatial-navigation';
import { setClientInfo } from '@pelagica/core';
import App from './App.tsx';
import { initGamepadNavigation } from './lib/gamepad-navigation';
import pkg from '../package.json' with { type: 'json' };

import '@pelagica/core/i18n';
import './index.css';
import './theme.css';

init();
initGamepadNavigation();
setClientInfo({ name: 'Pelagica Tizen', version: pkg.version });

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
