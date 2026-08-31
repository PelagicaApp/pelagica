import '../navigation/webos-globals.d.ts';

interface ConnectionManagerStatus {
    returnValue: boolean;
    wifi?: { ipAddress?: string };
    wired?: { ipAddress?: string };
}

/**
 * Returns the TV's local IP address via webOS's Connection Manager Luna service
 */
export const getWebosLocalIpAddress = (): Promise<string | null> =>
    new Promise((resolve) => {
        if (typeof window.WebOSServiceBridge !== 'function') {
            resolve(null);
            return;
        }
        try {
            const bridge = new window.WebOSServiceBridge();
            bridge.onservicecallback = (message) => {
                try {
                    const status: ConnectionManagerStatus = JSON.parse(message);
                    resolve(status.wifi?.ipAddress || status.wired?.ipAddress || null);
                } catch {
                    resolve(null);
                }
            };
            bridge.call('luna://com.palm.connectionmanager/getStatus', '{}');
        } catch {
            resolve(null);
        }
    });
