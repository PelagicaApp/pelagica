export {};

declare global {
    interface TizenHwKeyEvent extends Event {
        keyName: string;
    }

    interface Window {
        tizen?: {
            application: {
                getCurrentApplication: () => { exit: () => void };
            };
            tvinputdevice?: {
                registerKey: (keyName: string) => void;
                unregisterKey: (keyName: string) => void;
            };
        };
    }
}
