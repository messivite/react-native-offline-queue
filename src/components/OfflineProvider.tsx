import React, { useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineManager, type OfflineManagerConfig } from '../core/OfflineManager';

// ─── useNetworkStatus (useSyncExternalStore — zero unnecessary re-renders) ───
export function useNetworkStatus() {
    const isOnline = useSyncExternalStore(
        OfflineManager.subscribeNetwork,
        OfflineManager.getNetworkSnapshot,
        OfflineManager.getNetworkSnapshot
    );

    return { isOnline };
}

// ─── OfflineProvider ───
export interface OfflineProviderProps {
    children: React.ReactNode;
    config: OfflineManagerConfig;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children, config }) => {
    const wasOfflineRef = useRef(false);

    useEffect(() => {
        OfflineManager.configure(config);
    }, [config]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const connected = !!state.isConnected;
            if (__DEV__) console.log('[OfflineQueue] Network:', connected ? 'online' : 'offline', '| type:', state.type);

            // Update the singleton — only notifies listeners if value actually changed
            OfflineManager.setOnline(connected);

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

    // No context provider needed — useNetworkStatus reads from OfflineManager directly
    return <>{children}</>;
};
