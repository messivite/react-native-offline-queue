import type { StorageAdapter, RecordStorageAdapter } from './StorageAdapter';
import { MemoryStorageAdapter, isRecordAdapter } from './StorageAdapter';
import type { OfflineAction, SyncProgress, SyncProgressItem } from './types';
import { INITIAL_SYNC_PROGRESS } from './types';
import { getMMKVAdapter, getAsyncStorageAdapter, getRealmAdapter } from '../adapters';
import type { RealmAdapterOptions } from '../adapters';

// Simple UUID string generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface OfflineManagerConfig {
  storage?: StorageAdapter | RecordStorageAdapter;
  storageType?: 'mmkv' | 'async-storage' | 'memory' | 'realm';
  storageKey?: string;
  syncMode?: 'auto' | 'manual';

  // Realm-specific options (only used when storageType is 'realm')
  realmOptions?: RealmAdapterOptions;
  
  // The function that handles the actual API call for each queued action
  onSyncAction?: (action: OfflineAction) => Promise<void>;

  // Called when internet restores AND there are pending items in manual mode.
  onOnlineRestore?: (params: {
    pendingCount: number;
    syncNow: () => Promise<void>;
    discardQueue: () => Promise<void>;
  }) => void;
}

class OfflineManagerClass {
  private queue: OfflineAction[] = [];
  private storage: StorageAdapter | RecordStorageAdapter = new MemoryStorageAdapter();
  private storageKey: string = 'REACT_NATIVE_OFFLINE_QUEUE_STATE';
  private useRecordAdapter: boolean = false;
  
  // Queue listeners (for useOfflineQueue / useSyncExternalStore)
  private queueListeners: Set<() => void> = new Set();
  
  // Progress listeners (for useSyncProgress)
  private progressListeners: Set<() => void> = new Set();

  // Network status listeners (for useNetworkStatus / useSyncExternalStore)
  private networkListeners: Set<() => void> = new Set();

  // Per-action handler registry
  private actionHandlers: Map<string, (payload: any) => Promise<void>> = new Map();

  public isInitialized = false;
  public syncMode: 'auto' | 'manual' = 'manual';
  public onSyncAction?: (action: OfflineAction) => Promise<void>;
  public onOnlineRestore?: OfflineManagerConfig['onOnlineRestore'];
  public isSyncing = false;

  // ─── Network Status State ───
  private _isOnline: boolean | null = null;

  public get isOnline(): boolean | null {
    return this._isOnline;
  }

  public setOnline(online: boolean) {
    if (this._isOnline === online) return; // no change, no re-render
    this._isOnline = online;
    this.networkListeners.forEach((l) => l());
  }

  public subscribeNetwork = (listener: () => void): (() => void) => {
    this.networkListeners.add(listener);
    return () => this.networkListeners.delete(listener);
  };

  public getNetworkSnapshot = (): boolean | null => {
    return this._isOnline;
  };

  // ─── Sync Progress State ───
  private _syncProgress: SyncProgress = { ...INITIAL_SYNC_PROGRESS };

  public get syncProgress(): SyncProgress {
    return this._syncProgress;
  }

  // ─── Configuration ───
  public async configure(config: OfflineManagerConfig) {
    if (config.storageType) {
      if (config.storageType === 'mmkv') {
        this.storage = getMMKVAdapter();
        this.useRecordAdapter = false;
      } else if (config.storageType === 'async-storage') {
        this.storage = getAsyncStorageAdapter();
        this.useRecordAdapter = false;
      } else if (config.storageType === 'realm') {
        this.storage = getRealmAdapter(config.realmOptions);
        this.useRecordAdapter = true;
      } else {
        this.storage = new MemoryStorageAdapter();
        this.useRecordAdapter = false;
      }
    } else if (config.storage) {
      this.storage = config.storage;
      this.useRecordAdapter = isRecordAdapter(config.storage);
    }

    if (config.storageKey) {
      this.storageKey = config.storageKey;
    }
    if (config.syncMode) {
      this.syncMode = config.syncMode;
    }
    if (config.onSyncAction) {
      this.onSyncAction = config.onSyncAction;
    }
    if (config.onOnlineRestore) {
      this.onOnlineRestore = config.onOnlineRestore;
    }

    await this.loadQueue();
    this.isInitialized = true;
  }

  // ─── Storage (supports both adapter types) ───
  private async loadQueue() {
    try {
      if (this.useRecordAdapter) {
        const adapter = this.storage as RecordStorageAdapter;
        this.queue = await adapter.getAll();
      } else {
        const adapter = this.storage as StorageAdapter;
        const data = await adapter.getItem(this.storageKey);
        if (data) {
          this.queue = JSON.parse(data) || [];
        }
      }
      this.notifyQueueListeners();
    } catch (e) {
      console.warn('[OfflineManager] Failed to load queue from storage', e);
    }
  }

  private async saveQueue() {
    try {
      if (!this.useRecordAdapter) {
        const adapter = this.storage as StorageAdapter;
        await adapter.setItem(this.storageKey, JSON.stringify(this.queue));
      }
      // Record adapter saves per-operation, no need for full queue write
    } catch (e) {
      console.warn('[OfflineManager] Failed to save queue to storage', e);
    }
  }

  // ─── Queue Subscriptions (useSyncExternalStore) ───
  public subscribeQueue = (listener: () => void): (() => void) => {
    this.queueListeners.add(listener);
    return () => this.queueListeners.delete(listener);
  };

  // Backward compatibility alias
  public subscribe = this.subscribeQueue;

  private notifyQueueListeners() {
    this.queueListeners.forEach((l) => l());
  }

  // ─── Progress Subscriptions (useSyncExternalStore) ───
  public subscribeProgress = (listener: () => void): (() => void) => {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  };

  private updateProgress(partial: Partial<SyncProgress>) {
    this._syncProgress = { ...this._syncProgress, ...partial };
    this.progressListeners.forEach((l) => l());
  }

  private updateProgressItem(id: string, update: Partial<SyncProgressItem>) {
    this._syncProgress = {
      ...this._syncProgress,
      items: this._syncProgress.items.map((item) =>
        item.action.id === id ? { ...item, ...update } : item
      ),
    };
    this.progressListeners.forEach((l) => l());
  }

  // ─── Queue CRUD ───
  public async push<T>(actionName: string, payload: T): Promise<OfflineAction<T>> {
    const action: OfflineAction<T> = {
      id: generateUUID(),
      actionName,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    };
    this.queue = [...this.queue, action];

    if (this.useRecordAdapter) {
      await (this.storage as RecordStorageAdapter).insert(action as OfflineAction);
    } else {
      await this.saveQueue();
    }

    this.notifyQueueListeners();
    return action;
  }

  public async remove(id: string): Promise<void> {
    this.queue = this.queue.filter((a) => a.id !== id);

    if (this.useRecordAdapter) {
      await (this.storage as RecordStorageAdapter).remove(id);
    } else {
      await this.saveQueue();
    }

    this.notifyQueueListeners();
  }

  public async clear(): Promise<void> {
    this.queue = [];

    if (this.useRecordAdapter) {
      await (this.storage as RecordStorageAdapter).clear();
    } else {
      await this.saveQueue();
    }

    this.notifyQueueListeners();
    this.updateProgress({ ...INITIAL_SYNC_PROGRESS });
  }

  public getQueue(): OfflineAction[] {
    return this.queue;
  }

  // ─── Per-Action Handler Registry ───
  public registerHandler(actionName: string, handler: (payload: any) => Promise<void>) {
    this.actionHandlers.set(actionName, handler);
  }

  public unregisterHandler(actionName: string) {
    this.actionHandlers.delete(actionName);
  }

  public getHandler(actionName: string): ((payload: any) => Promise<void>) | undefined {
    return this.actionHandlers.get(actionName);
  }

  // ─── The Central Sync Mechanism (with progress tracking) ───
  public async flushQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isSyncing) {
      return;
    }

    const hasAnyHandler = this.onSyncAction || this.actionHandlers.size > 0;
    if (!hasAnyHandler) {
      console.warn('[OfflineManager] No handlers registered and no onSyncAction configured.');
      return;
    }

    this.isSyncing = true;
    this.notifyQueueListeners();

    const currentQueue = [...this.queue];

    // Initialize progress tracking for this sync session
    const progressItems: SyncProgressItem[] = currentQueue.map((action) => ({
      action,
      status: 'pending' as const,
    }));

    this.updateProgress({
      isActive: true,
      totalCount: currentQueue.length,
      completedCount: 0,
      failedCount: 0,
      currentAction: null,
      items: progressItems,
    });

    let completedCount = 0;
    let failedCount = 0;

    for (const action of currentQueue) {
      // Mark current item as "syncing"
      this.updateProgress({ currentAction: action });
      this.updateProgressItem(action.id, { status: 'syncing' });

      try {
        // Per-action handler takes priority, then fallback to onSyncAction
        const handler = this.actionHandlers.get(action.actionName);
        if (handler) {
          await handler(action.payload);
        } else if (this.onSyncAction) {
          await this.onSyncAction(action);
        } else {
          throw new Error(`No handler registered for action: ${action.actionName}`);
        }

        // Success → remove from queue + mark in progress
        await this.remove(action.id);
        completedCount++;
        this.updateProgressItem(action.id, { status: 'success' });
        this.updateProgress({ completedCount });
      } catch (error: any) {
        console.warn(`[OfflineManager] Action ${action.actionName} failed to sync.`, error);

        // Mark as failed in progress
        failedCount++;
        this.updateProgressItem(action.id, {
          status: 'failed',
          error: error?.message || 'Unknown error',
        });
        this.updateProgress({ failedCount });

        // Update retry count on the queue item
        const target = this.queue.find((a) => a.id === action.id);
        if (target) {
          target.retryCount += 1;
        }

        if (this.useRecordAdapter) {
          await (this.storage as RecordStorageAdapter).update(action.id, {
            retryCount: (target?.retryCount || 0),
          });
        } else {
          await this.saveQueue();
        }

        this.notifyQueueListeners();
      }
    }

    this.isSyncing = false;
    this.updateProgress({ isActive: false, currentAction: null });
    this.notifyQueueListeners();
  }

  // ─── Called by OfflineProvider when internet restores ───
  public handleOnlineRestore() {
    if (this.queue.length === 0) return;

    if (this.syncMode === 'auto') {
      this.flushQueue();
    } else if (this.syncMode === 'manual' && this.onOnlineRestore) {
      this.onOnlineRestore({
        pendingCount: this.queue.length,
        syncNow: () => this.flushQueue(),
        discardQueue: () => this.clear(),
      });
    }
    // If manual + no onOnlineRestore → silent (nothing happens)
  }
}

export const OfflineManager = new OfflineManagerClass();
