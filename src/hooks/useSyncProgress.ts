import { useSyncExternalStore } from 'react';
import { OfflineManager } from '../core/OfflineManager';

const subscribeProgress = (listener: () => void) => OfflineManager.subscribeProgress(listener);
const getProgressSnapshot = () => OfflineManager.syncProgress;

/**
 * Live sync progress tracker.
 * Use this inside a BottomSheet, Modal, or any UI to show per-item sync status.
 *
 * Returns:
 * - isActive: whether a sync session is currently running
 * - totalCount: total items in this sync batch
 * - completedCount: successfully synced so far
 * - failedCount: items that failed
 * - currentAction: the action currently being synced
 * - items: full list with per-item status (pending | syncing | success | failed)
 * - percentage: 0-100 completion percentage
 */
export function useSyncProgress() {
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getProgressSnapshot);

  const percentage =
    progress.totalCount > 0
      ? Math.round(((progress.completedCount + progress.failedCount) / progress.totalCount) * 100)
      : 0;

  return {
    ...progress,
    percentage,
  };
}
