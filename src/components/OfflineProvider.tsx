import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineManager, type OfflineManagerConfig } from '../core/OfflineManager';

interface OfflineContextValue {
    isOnline: boolean | null;
}

const OfflineContext = createContext<OfflineContextValue>({ isOnline: true });

export const useNetworkStatus = () => useContext(OfflineContext);

export interface OfflineProviderProps {
    children: React.ReactNode;
    config: OfflineManagerConfig;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children, config }) => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const wasOfflineRef = useRef(false);

    useEffect(() => {
        OfflineManager.configure(config);
    }, [config]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const connected = !!state.isConnected;
            if (__DEV__) console.log('[OfflineQueue] Network:', connected ? 'online' : 'offline', '| type:', state.type);

            setIsOnline(connected);

            if (!connected) {
                wasOfflineRef.current = true;
            }

            if (connected && wasOfflineRef.current) {
                wasOfflineRef.current = false;
                if (__DEV__) console.log('[OfflineQueue] Network restored, triggering sync handler');
                OfflineManager.handleOnlineRestore();
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <OfflineContext.Provider value={{ isOnline }}>
            {children}
        </OfflineContext.Provider>
    );
};
