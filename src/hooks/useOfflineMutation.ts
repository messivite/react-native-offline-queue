import { OfflineManager } from '../core/OfflineManager';
import { useNetworkStatus } from '../components/OfflineProvider';

export function useOfflineMutation<TPayload>(
  actionName: string,
  options?: {
    onOptimisticSuccess?: (payload: TPayload) => void;
    onError?: (error: Error, payload: TPayload) => void;
  }
) {
  const { isOnline } = useNetworkStatus();

  const mutateOffline = async (payload: TPayload) => {
    if (isOnline && OfflineManager.onSyncAction) {
      // ── ONLINE: Execute directly, skip the queue ──
      if (__DEV__) console.log(`[OfflineQueue] mutate: ${actionName} (direct)`);
      try {
        await OfflineManager.onSyncAction({
          id: '',
          actionName,
          payload,
          createdAt: Date.now(),
          retryCount: 0,
        });
        // API succeeded → trigger optimistic callback
        options?.onOptimisticSuccess?.(payload);
      } catch (error: any) {
        console.warn(`[OfflineQueue] mutate: ${actionName} failed, falling back to queue`, error);
        // API failed even though online → fallback to queue
        await OfflineManager.push(actionName, payload);
        options?.onOptimisticSuccess?.(payload);
        options?.onError?.(error, payload);
      }
    } else {
      // ── OFFLINE: Add to queue + optimistic update ──
      if (__DEV__) console.log(`[OfflineQueue] mutate: ${actionName} (queued)`);
      await OfflineManager.push(actionName, payload);
      options?.onOptimisticSuccess?.(payload);
    }
  };

  return { mutateOffline };
}
