# Types

## OfflineAction

Represents a single queued operation.

```tsx
interface OfflineAction<TPayload = any> {
  id: string;             // Unique identifier (auto-generated UUID)
  actionName: string;     // Developer-defined name (e.g. 'LIKE_POST')
  payload: TPayload;      // The data to send when syncing
  createdAt: number;      // Timestamp when queued
  retryCount: number;     // Number of failed sync attempts
}
```

## MutationStatus

Status of a single mutation call.

```tsx
type MutationStatus = 'idle' | 'loading' | 'success' | 'error' | 'queued';
```

| Status | When |
|--------|------|
| `idle` | Before any mutation |
| `loading` | Handler is running (online only) |
| `success` | Direct API call succeeded |
| `error` | Direct API call threw (rare — usually falls to `queued`) |
| `queued` | Action saved to offline queue |

## OfflineMutationResult

Return type of `useOfflineMutation`.

```tsx
interface OfflineMutationResult<TPayload> {
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
```

## OfflineManagerConfig

Configuration object passed to `OfflineProvider` or `OfflineManager.configure()`.

```tsx
interface OfflineManagerConfig {
  storage?: StorageAdapter | RecordStorageAdapter;
  storageType?: 'mmkv' | 'async-storage' | 'memory' | 'realm';
  storageKey?: string;
  syncMode?: 'auto' | 'manual';
  realmOptions?: RealmAdapterOptions;
  onSyncAction?: (action: OfflineAction) => Promise<void>;
  onOnlineRestore?: (params: {
    pendingCount: number;
    syncNow: () => Promise<void>;
    discardQueue: () => Promise<void>;
  }) => void;
}
```

## SyncProgress

Tracks the state of an active sync session.

```tsx
interface SyncProgress {
  isActive: boolean;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  currentAction: OfflineAction | null;
  items: SyncProgressItem[];
}
```

## SyncProgressItem

Per-item status within a sync session.

```tsx
interface SyncProgressItem {
  action: OfflineAction;
  status: SyncItemStatus;
  error?: string;
}

type SyncItemStatus = 'pending' | 'syncing' | 'success' | 'failed';
```

## StorageAdapter

Key-value storage interface (MMKV, AsyncStorage, Memory).

```tsx
interface StorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}
```

## RecordStorageAdapter

Record-based storage interface (Realm, SQLite, WatermelonDB).

```tsx
interface RecordStorageAdapter {
  insert: (action: OfflineAction) => Promise<void> | void;
  remove: (id: string) => Promise<void> | void;
  getAll: () => Promise<OfflineAction[]> | OfflineAction[];
  clear: () => Promise<void> | void;
  update: (id: string, partial: Partial<OfflineAction>) => Promise<void> | void;
}
```

## RealmAdapterOptions

```tsx
interface RealmAdapterOptions {
  realmInstance?: any;     // Your existing Realm instance
  schemaName?: string;     // Custom table name (default: 'OfflineQueueItem')
}
```
