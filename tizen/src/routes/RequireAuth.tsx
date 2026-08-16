import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken, getServerUrl } from '@pelagica/core';

export function RequireAuth({ children }: { children: ReactNode }) {
    const location = useLocation();

    if (!getServerUrl() || !getAccessToken()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}
