const DEVICE_ID_STORAGE_KEY = 'jf_device_id';

function generateDeviceId(): string {
    return 'pelagica-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now().toString(36);
}

export function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }

    return deviceId;
}

export function clearDeviceId(): void {
    localStorage.removeItem(DEVICE_ID_STORAGE_KEY);
}
