import React from 'react';
import { useNetworkStatus } from './OfflineProvider';
import { useOfflineQueue } from '../hooks/useOfflineQueue';

export interface OfflineSyncPromptProps {
    children: (props: {
        pendingCount: number;
        isSyncing: boolean;
        syncNow: () => Promise<void>;
        cancel: () => Promise<void>;
    }) => React.ReactNode;
}

export const OfflineSyncPrompt: React.FC<OfflineSyncPromptProps> = ({ children }) => {
    const { isOnline } = useNetworkStatus();
    const { pendingCount, isSyncing, syncNow, clearQueue } = useOfflineQueue();

    if (isOnline && pendingCount > 0) {
        return (
            <>
                {children({
                    pendingCount,
                    isSyncing,
                    syncNow,
                    cancel: clearQueue,
                })}
            </>
        );
    }

    return null;
};
