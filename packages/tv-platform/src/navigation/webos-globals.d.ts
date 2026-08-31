export {};

declare global {
    interface Window {
        /** Auto-injected by the webOS runtime on-device; undefined in a plain browser. */
        PalmSystem?: {
            platformBack?: () => void;
        };
        /** Auto-injected Luna Bus bridge; undefined in a plain browser. No script tag required. */
        WebOSServiceBridge?: new () => {
            onservicecallback: ((message: string) => void) | null;
            call: (uri: string, params: string) => void;
            cancel?: () => void;
        };
    }
}
