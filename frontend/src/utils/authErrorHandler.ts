import { logoutFromSeerr } from '@/api/seerr/logout';
import { clearDeviceId } from './deviceId';
import { clearCredentials } from './localstorageCredentials';

export function isAuthError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        return status === 401 || status === 403;
    }
    return false;
}

export function clearAuthAndRedirect() {
    void logoutFromSeerr();
    clearCredentials();
    clearDeviceId();

    window.location.href = '/login';
}

export function getRetryConfig() {
    return {
        retry: (failureCount: number, error: unknown) => {
            if (isAuthError(error)) {
                clearAuthAndRedirect();
                return false;
            }
            return failureCount < 3;
        },
    };
}
