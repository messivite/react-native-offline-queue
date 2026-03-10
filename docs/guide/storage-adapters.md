# Storage Adapters

## Comparison

| Adapter | Install | Limits | Best For |
|---------|---------|--------|----------|
| **MMKV** | `npm i react-native-mmkv` | ~unlimited (file-backed). Per-value performance drops above ~256KB. | Small-to-medium queues (<1000 items). Fastest read/write. |

::: info MMKV v4
This package uses `createMMKV()` (react-native-mmkv v4 API). If you are on v3, upgrade: `npm i react-native-mmkv@^4`.
:::
| **AsyncStorage** | `npm i @react-native-async-storage/async-storage` | Android: **6MB total** (default). iOS: no hard limit (SQLite). Per-value: **2MB on Android**. | Apps already using AsyncStorage. |
| **Realm** | `npm i realm` | No practical limit. Native database. | Large queues (10,000+ items) or large payloads. |
| **Memory** | built-in | RAM only — **lost on app kill**. | Development and testing. |

::: tip How much data is realistic?
A typical queued action is ~200–500 bytes (JSON). 1000 queued actions ≈ 500KB — well within limits for all adapters. If your queue could grow beyond 5000+ items or individual payloads exceed 1MB, use Realm.
:::

## Built-in Adapters

```tsx
// MMKV (recommended)
<OfflineProvider config={{ storageType: 'mmkv', ... }} />

// AsyncStorage
<OfflineProvider config={{ storageType: 'async-storage', ... }} />

// Realm (record-based)
<OfflineProvider config={{ storageType: 'realm', ... }} />

// In-memory (no persistence)
<OfflineProvider config={{ storageType: 'memory', ... }} />
```

## Realm: Record-Based Storage

Unlike MMKV and AsyncStorage (which store the entire queue as one JSON string), Realm creates a **separate database record** for each queue item.

### Zero-Config

```tsx
<OfflineProvider config={{ storageType: 'realm', syncMode: 'auto', onSyncAction: handler }}>
  <App />
</OfflineProvider>
```

This automatically creates an `OfflineQueueItem` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | string (PK) | Unique action ID |
| `actionName` | string | e.g. `'LIKE_POST'` |
| `payload` | string | JSON-stringified payload |
| `createdAt` | int | Timestamp |
| `retryCount` | int | Failed attempt count |

### Shared Realm Instance

If your app already uses Realm, share the instance:

```tsx
const realm = await Realm.open({
  schema: [UserSchema, PostSchema, OfflineQueueItemSchema],
});

<OfflineProvider config={{
  storageType: 'realm',
  realmOptions: { realmInstance: realm },
  syncMode: 'auto',
  onSyncAction: handler,
}} />
```

### Performance

| Operation | MMKV (key-value) | Realm (record-based) |
|-----------|-------------------|----------------------|
| Push 1 item (100 in queue) | Rewrite 100 items | Insert 1 record |
| Push 1 item (10,000 in queue) | Rewrite 10,000 items | Insert 1 record |
| Remove 1 item | Rewrite entire queue | Delete 1 record |

## Custom Adapter

Implement the `StorageAdapter` interface:

```tsx
import type { StorageAdapter } from '@mustafaaksoy41/react-native-offline-queue';

const myStorage: StorageAdapter = {
  getItem: async (key) => { /* return string | null */ },
  setItem: async (key, value) => { /* persist string */ },
  removeItem: async (key) => { /* delete key */ },
};

<OfflineProvider config={{ storage: myStorage, ... }} />
```

Or for databases, use `RecordStorageAdapter`:

```tsx
import type { RecordStorageAdapter } from '@mustafaaksoy41/react-native-offline-queue';

const myDbAdapter: RecordStorageAdapter = {
  insert: async (action) => { /* INSERT one record */ },
  remove: async (id) => { /* DELETE one record */ },
  getAll: async () => { /* SELECT all, return OfflineAction[] */ },
  clear: async () => { /* DELETE all */ },
  update: async (id, partial) => { /* UPDATE one record */ },
};

<OfflineProvider config={{ storage: myDbAdapter, ... }} />
```
