import { useEffect, useRef } from 'react';
import { OfflineManager } from '../core/OfflineManager';
import { useNetworkStatus } from '../components/OfflineProvider';

export function useOfflineMutation<TPayload>(
  actionName: string,
  options?: {
    handler?: (payload: TPayload) => Promise<void>;
    onOptimisticSuccess?: (payload: TPayload) => void;
    onError?: (error: Error, payload: TPayload) => void;
  }
) {
  const { isOnline } = useNetworkStatus();
  const handlerRef = useRef(options?.handler);
  handlerRef.current = options?.handler;

  // Register per-action handler (persists even after unmount)
  useEffect(() => {
    if (handlerRef.current) {
      OfflineManager.registerHandler(actionName, (payload: any) =>
        handlerRef.current!(payload)
      );
    }
  }, [actionName]);

  const mutateOffline = async (payload: TPayload) => {
    // Resolve which handler to use: per-action handler > global onSyncAction
    const handler = handlerRef.current || OfflineManager.getHandler(actionName);
    const globalHandler = OfflineManager.onSyncAction;
    const hasHandler = handler || globalHandler;

    if (isOnline && hasHandler) {
      // ── ONLINE: Execute directly, skip the queue ──
      if (__DEV__) console.log(`[OfflineQueue] mutate: ${actionName} (direct)`);
      try {
        if (handler) {
          await handler(payload);
        } else if (globalHandler) {
          await globalHandler({
            id: '',
            actionName,
            payload,
            createdAt: Date.now(),
            retryCount: 0,
          });
        }
        options?.onOptimisticSuccess?.(payload);
      } catch (error: any) {
        console.warn(`[OfflineQueue] mutate: ${actionName} failed, falling back to queue`, error);
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
