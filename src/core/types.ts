export interface OfflineAction<TPayload = any> {
  id: string;             // Unique identifier for the action
  actionName: string;     // The developer-defined name of the action
  payload: TPayload;      // The generic payload (e.g. data to POST)
  createdAt: number;      // Timestamp of when the action was queued
  retryCount: number;     // Number of failed attempts
}

export type SyncItemStatus = 'pending' | 'syncing' | 'success' | 'failed';

export interface SyncProgressItem {
  action: OfflineAction;
  status: SyncItemStatus;
  error?: string;
}

export interface SyncProgress {
  isActive: boolean;          // Is a sync session currently running?
  totalCount: number;         // Total items when sync started
  completedCount: number;     // Successfully synced count
  failedCount: number;        // Failed items count
  currentAction: OfflineAction | null;  // Item currently being synced
  items: SyncProgressItem[];  // Full progress of every item in this session
}

export const INITIAL_SYNC_PROGRESS: SyncProgress = {
  isActive: false,
  totalCount: 0,
  completedCount: 0,
  failedCount: 0,
  currentAction: null,
  items: [],
};
