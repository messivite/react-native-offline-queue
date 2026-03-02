import { useEffect, useRef, useState, useCallback } from 'react';
import { OfflineManager } from '../core/OfflineManager';
import { useNetworkStatus } from '../components/OfflineProvider';

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error' | 'queued';

export interface OfflineMutationResult<TPayload> {
  mutateOffline: (payload: TPayload) => Promise<void>;
  status: MutationStatus;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isQueued: boolean;
  error: Error | null;
  reset: () => void;
}

export function useOfflineMutation<TPayload>(
  actionName: string,
  options?: {
    handler?: (payload: TPayload) => Promise<void>;
    onOptimisticSuccess?: (payload: TPayload) => void;
    onError?: (error: Error, payload: TPayload) => void;
    onSuccess?: (payload: TPayload) => void;
  }
): OfflineMutationResult<TPayload> {
  const { isOnline } = useNetworkStatus();
  const handlerRef = useRef(options?.handler);
  handlerRef.current = options?.handler;

  const [status, setStatus] = useState<MutationStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Register per-action handler (persists even after unmount)
  useEffect(() => {
    if (handlerRef.current) {
      OfflineManager.registerHandler(actionName, (payload: any) =>
        handlerRef.current!(payload)
      );
    }
  }, [actionName]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const mutateOffline = useCallback(async (payload: TPayload) => {
    // Resolve which handler to use: per-action handler > global onSyncAction
    const handler = handlerRef.current || OfflineManager.getHandler(actionName);
    const globalHandler = OfflineManager.onSyncAction;
    const hasHandler = handler || globalHandler;

    if (isOnline && hasHandler) {
      // ── ONLINE: Execute directly, skip the queue ──
      if (__DEV__) console.log(`[OfflineQueue] mutate: ${actionName} (direct)`);
      setStatus('loading');
      setError(null);
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
        setStatus('success');
        options?.onOptimisticSuccess?.(payload);
        options?.onSuccess?.(payload);
      } catch (err: any) {
        console.warn(`[OfflineQueue] mutate: ${actionName} failed, falling back to queue`, err);
        // API failed even though online → fallback to queue
        await OfflineManager.push(actionName, payload);
        setStatus('queued');
        setError(err);
        options?.onOptimisticSuccess?.(payload);
        options?.onError?.(err, payload);
      }
    } else {
      // ── OFFLINE: Add to queue + optimistic update ──
      if (__DEV__) console.log(`[OfflineQueue] mutate: ${actionName} (queued)`);
      await OfflineManager.push(actionName, payload);
      setStatus('queued');
      setError(null);
      options?.onOptimisticSuccess?.(payload);
    }
  }, [actionName, isOnline, options]);

  return {
    mutateOffline,
    status,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isQueued: status === 'queued',
    error,
    reset,
  };
}
