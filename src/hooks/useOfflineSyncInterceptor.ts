import { useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from '../components/OfflineProvider';
import { useOfflineQueue } from './useOfflineQueue';

export interface InterceptorOptions {
  onPromptNeeded: (params: {
    pendingCount: number;
    syncNow: () => Promise<void>;
    discardQueue: () => Promise<void>;
  }) => void;
}

export function useOfflineSyncInterceptor({ onPromptNeeded }: InterceptorOptions) {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, syncNow, clearQueue } = useOfflineQueue();

  const onPromptNeededRef = useRef(onPromptNeeded);
  useEffect(() => {
    onPromptNeededRef.current = onPromptNeeded;
  });

  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !hasPrompted) {
      setHasPrompted(true);
      onPromptNeededRef.current({
        pendingCount,
        syncNow: async () => {
          await syncNow();
        },
        discardQueue: clearQueue,
      });
    } else if (!isOnline || pendingCount === 0) {
      // Reset prompt state when offline or when queue is cleared
      setHasPrompted(false);
    }
  }, [isOnline, pendingCount, hasPrompted, syncNow, clearQueue]);
}
