# Storage Adapters API

## Built-in Factory Functions

### getMMKVAdapter()

Creates a `StorageAdapter` backed by [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv).

```tsx
import { getMMKVAdapter } from 'react-native-offline-queue';

const adapter = getMMKVAdapter();
```

::: warning
Requires `react-native-mmkv` to be installed. Throws with a helpful error message if missing.
:::

::: info v4 API
Uses `createMMKV()` (react-native-mmkv v4). The v3 API (`new MMKV()`) was removed. Use `react-native-mmkv@^4`.
:::

### getAsyncStorageAdapter()

Creates a `StorageAdapter` backed by [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage).

```tsx
import { getAsyncStorageAdapter } from 'react-native-offline-queue';

const adapter = getAsyncStorageAdapter();
```

### getRealmAdapter(options?)

Creates a `RecordStorageAdapter` backed by [Realm](https://www.mongodb.com/docs/realm/sdk/react-native/).

```tsx
import { getRealmAdapter } from 'react-native-offline-queue';

// Default: creates its own Realm file and schema
const adapter = getRealmAdapter();

// Custom: use your own Realm instance
const adapter = getRealmAdapter({
  realmInstance: myRealm,
  schemaName: 'MyCustomQueueTable',
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `realmInstance` | `Realm` | auto-created | Your existing Realm instance |
| `schemaName` | `string` | `'OfflineQueueItem'` | Table name in the database |

## Type Guard

### isRecordAdapter(adapter)

Check whether an adapter is key-value or record-based:

```tsx
import { isRecordAdapter } from 'react-native-offline-queue';

if (isRecordAdapter(adapter)) {
  // RecordStorageAdapter: insert, remove, getAll, clear, update
} else {
  // StorageAdapter: getItem, setItem, removeItem
}
```
