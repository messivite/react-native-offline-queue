# 4. Realm — Storage for Large Queues

Use **Realm** when:
- Your queue can grow to **10,000+ items**
- Individual payloads are **large** (e.g. base64 images)
- Your app **already uses Realm** for other data
- You need **record-based storage** — each item is a separate DB record (no full JSON rewrite on each push/remove)

## How It Differs from MMKV/AsyncStorage

| Storage | How it works | Best for |
|---------|--------------|----------|
| MMKV / AsyncStorage | Entire queue = one JSON string. Push/remove rewrites the whole thing. | Small-to-medium queues (<1000 items) |
| **Realm** | Each item = one record. Insert/delete = single record operation. | Large queues, heavy payloads |

## Installation

```bash
npm install realm
cd ios && pod install
```

## Option A: Zero-Config (Simplest)

The package creates its own Realm file. No schema setup needed:

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

<OfflineProvider
  config={{
    storageType: 'realm',
    syncMode: 'auto',
    onSyncAction: async (action) => {
      const res = await fetch(`https://api.example.com/${action.actionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
  }}
>
  <App />
</OfflineProvider>
```

This creates:
- **File:** `offline-queue.realm`
- **Table:** `OfflineQueueItem` (id, actionName, payload, createdAt, retryCount)

## Option B: Shared Realm (App Already Uses Realm)

If your app already has a Realm instance (e.g. for users, posts), share it:

```tsx
import Realm from 'realm';
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

// Your app schemas
const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: { id: 'string', name: 'string', email: 'string' },
};

// Queue schema (required by the package)
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

<OfflineProvider
  config={{
    storageType: 'realm',
    realmOptions: { realmInstance: realm },
    syncMode: 'auto',
    onSyncAction: myHandler,
  }}
>
  <App />
</OfflineProvider>
```

## Option C: Direct Adapter (Background Tasks, Service Layer)

For background sync or non-React contexts:

```tsx
import { getRealmAdapter, OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';

const realmAdapter = getRealmAdapter({ realmInstance: myRealm });

await OfflineManager.configure({
  storage: realmAdapter,
  onSyncAction: async (action) => { /* ... */ },
});

await OfflineManager.push('SYNC_DATA', { key: 'value' });
await OfflineManager.flushQueue();
```

## When to Choose Realm

- Queue often has **1000+ items** → Realm is faster (no full JSON parse/serialize)
- Payloads are **large** (e.g. >100KB each) → Realm handles them efficiently
- You already use Realm → Share the instance, one DB

**Next:** [Background Sync →](/examples/background) — Sync when app is in background
