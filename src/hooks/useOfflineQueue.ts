import { useSyncExternalStore } from 'react';
import { OfflineManager } from '../core/OfflineManager';

const subscribe = (listener: () => void) => OfflineManager.subscribe(listener);
const getSnapshot = () => OfflineManager.getQueue();

export function useOfflineQueue() {
  const queue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    queue,
    pendingCount: queue.length,
    isSyncing: OfflineManager.isSyncing,
    syncNow: () => OfflineManager.flushQueue(),
    clearQueue: () => OfflineManager.clear(),
  };
}
