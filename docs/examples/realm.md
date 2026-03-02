# With Realm

Using Realm as the storage backend for large queues or apps that already use Realm.

## Installation

```bash
npm install realm
cd ios && pod install
```

## Zero-Config Setup

The simplest approach — the package creates its own Realm file and table:

```tsx
import { OfflineProvider } from 'react-native-offline-queue';

<OfflineProvider config={{
  storageType: 'realm',
  syncMode: 'auto',
  onSyncAction: async (action) => {
    await fetch(`https://api.example.com/${action.actionName}`, {
      method: 'POST',
      body: JSON.stringify(action.payload),
    });
  },
}}>
  <App />
</OfflineProvider>
```

This creates:
- File: `offline-queue.realm`
- Table: `OfflineQueueItem` (id, actionName, payload, createdAt, retryCount)

## Shared Realm Instance

If your app already uses Realm for its data, share the database:

```tsx
import Realm from 'realm';
import { OfflineProvider } from 'react-native-offline-queue';

// Your app schemas
const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: { id: 'string', name: 'string', email: 'string' },
};

// The offline queue schema (provided by the package)
const OfflineQueueItemSchema = {
  name: 'OfflineQueueItem',
  primaryKey: 'id',
  properties: {
    id: 'string',
    actionName: 'string',
    payload: 'string',
    createdAt: 'int',
    retryCount: { type: 'int', default: 0 },
  },
};

// Open one shared Realm
const realm = await Realm.open({
  schema: [UserSchema, OfflineQueueItemSchema],
});

// Pass it to the provider
<OfflineProvider config={{
  storageType: 'realm',
  realmOptions: { realmInstance: realm },
  syncMode: 'auto',
  onSyncAction: myHandler,
}}>
  <App />
</OfflineProvider>
```

## Direct Adapter Usage

For advanced scenarios or background tasks:

```tsx
import { getRealmAdapter, OfflineManager } from 'react-native-offline-queue';

// Create the adapter manually
const realmAdapter = getRealmAdapter({
  realmInstance: myRealm,
});

// Use it with OfflineManager
await OfflineManager.configure({
  storage: realmAdapter,
  onSyncAction: myHandler,
});

// Now push/flush as normal
await OfflineManager.push('SYNC_DATA', { key: 'value' });
await OfflineManager.flushQueue();
```
