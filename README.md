<div align="center">

# 📡 react-native-offline-queue

**A lightweight, high-performance offline queue and sync manager for React Native.**
Queue operations when offline, sync automatically or manually when connectivity returns.

<br />

<!-- Package Info -->
[![npm version](https://img.shields.io/npm/v/@mustafaaksoy41/react-native-offline-queue?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@mustafaaksoy41/react-native-offline-queue)
[![npm downloads](https://img.shields.io/npm/dm/@mustafaaksoy41/react-native-offline-queue?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@mustafaaksoy41/react-native-offline-queue)
[![license](https://img.shields.io/npm/l/@mustafaaksoy41/react-native-offline-queue?style=for-the-badge&logo=opensourceinitiative&logoColor=white&color=3DA639)](https://github.com/mustafaaksoy41/react-native-offline-queue/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mustafaaksoy41/react-native-offline-queue?style=for-the-badge&logo=webpack&logoColor=white&color=8DD6F9&label=size)](https://bundlephobia.com/package/@mustafaaksoy41/react-native-offline-queue)

<!-- Platform & Language -->
[![Platform - Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://reactnative.dev/)
[![Platform - iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=apple&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)

<!-- Supported Storage Adapters -->
[![MMKV](https://img.shields.io/badge/MMKV-FF6C37?style=for-the-badge&logo=firebase&logoColor=white)](https://github.com/mrousavy/react-native-mmkv)
[![AsyncStorage](https://img.shields.io/badge/AsyncStorage-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://react-native-async-storage.github.io/async-storage/)
[![Realm](https://img.shields.io/badge/Realm-39477F?style=for-the-badge&logo=realm&logoColor=white)](https://www.mongodb.com/docs/realm/sdk/react-native/)
[![In Memory](https://img.shields.io/badge/In_Memory-00C853?style=for-the-badge&logo=databricks&logoColor=white)](#storage-adapters)

<!-- Core Dependency -->
[![NetInfo](https://img.shields.io/badge/NetInfo-0088CC?style=for-the-badge&logo=wifi&logoColor=white)](https://github.com/react-native-netinfo/react-native-netinfo)

<br />

<p align="center">
  <b>🔌 Offline-First</b> · <b>⚡ Optimistic UI</b> · <b>🔄 Auto / Manual Sync</b> · <b>📦 Pluggable Storage</b> · <b>📊 Live Progress</b>
</p>

---

</div>

## Features

- **Offline-first mutations** — API calls are queued when offline, executed when online
- **Optimistic UI updates** — UI responds instantly, data syncs in the background
- **Flexible sync modes** — `auto` (silent sync) or `manual` (prompt the user)
- **Pluggable storage** — MMKV, AsyncStorage, or bring your own adapter
- **Live sync progress** — track each item as it syncs (pending → syncing → success/failed)
- **Zero unnecessary renders** — built on `useSyncExternalStore`
- **Customizable restore UI** — Alert, Toast, BottomSheet, or silent — you decide
- **Background task compatible** — use `OfflineManager.flushQueue()` from any context

## Installation

```bash
npm install @mustafaaksoy41/react-native-offline-queue

# Required peer dependency
npm install @react-native-community/netinfo

# Pick ONE storage adapter (optional — defaults to in-memory)
npm install react-native-mmkv           # Recommended: fast, synchronous
# OR
npm install @react-native-async-storage/async-storage
```

### iOS

```bash
cd ios && pod install
```

## Quick Start

### 1. Wrap your app with `OfflineProvider`

You can handle sync in two ways. Pick the one that fits your project:

**Option A — Per-action handlers (recommended)**

Each component defines its own API call. Provider stays clean:

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

export default function App() {
  return (
    <OfflineProvider config={{ storageType: 'mmkv', syncMode: 'auto' }}>
      <YourApp />
    </OfflineProvider>
  );
}
```

**Option B — Centralized handler**

One global function handles all actions. Useful if you want a single place to manage API calls:

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

const offlineConfig = {
  storageType: 'mmkv',
  syncMode: 'auto',
  onSyncAction: async (action) => {
    switch (action.actionName) {
      case 'LIKE_POST':
        await api.likePost(action.payload);
        break;
      case 'CREATE_POST':
        await api.createPost(action.payload);
        break;
      case 'SEND_MESSAGE':
        await api.sendMessage(action.payload);
        break;
    }
  },
};

export default function App() {
  return (
    <OfflineProvider config={offlineConfig}>
      <YourApp />
    </OfflineProvider>
  );
}
```

### 2. Use mutations in your components

**With per-action handler (Option A):**

Each component defines its own API call via `handler`:

```tsx
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  const { mutateOffline } = useOfflineMutation('LIKE_POST', {
    handler: async (payload) => {
      await fetch('https://api.example.com/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
    onOptimisticSuccess: () => setLiked(true),
  });

  return (
    <Button
      title={liked ? '❤️' : '🤍'}
      onPress={() => mutateOffline({ postId })}
    />
  );
}
```

**Without handler (Option B):**

If you're using a centralized `onSyncAction`, just skip the `handler` — the global function will handle it:

```tsx
function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  const { mutateOffline } = useOfflineMutation('LIKE_POST', {
    onOptimisticSuccess: () => setLiked(true),
  });

  return (
    <Button
      title={liked ? '❤️' : '🤍'}
      onPress={() => mutateOffline({ postId })}
    />
  );
}
```

**How it works:**
- **Online**: The handler (or `onSyncAction`) runs immediately. No queue involved.
- **Offline**: The action is saved to the queue, and `onOptimisticSuccess` fires so the UI updates instantly.
- **When connectivity returns**: Queued actions are synced — per-action handler first, then `onSyncAction` as fallback.

### Full Example

Here's what a real app looks like with multiple offline-capable actions. Each component owns its own API logic — no central switch-case needed.

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

export default function App() {
  return (
    <OfflineProvider config={{ storageType: 'mmkv', syncMode: 'auto' }}>
      <HomeScreen />
    </OfflineProvider>
  );
}
```

```tsx
// CreatePostForm.tsx
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

function CreatePostForm() {
  const { mutateOffline } = useOfflineMutation('CREATE_POST', {
    handler: async (payload) => {
      await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onOptimisticSuccess: (payload) => {
      // Add to local list immediately
      setPosts((prev) => [...prev, { ...payload, id: 'temp', pending: true }]);
    },
  });

  return <Button title="Post" onPress={() => mutateOffline({ title, body })} />;
}
```

```tsx
// CommentSection.tsx
function CommentSection({ postId }) {
  const { mutateOffline } = useOfflineMutation('ADD_COMMENT', {
    handler: async (payload) => {
      await fetch(`/api/posts/${payload.postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: payload.text }),
      });
    },
    onOptimisticSuccess: (payload) => {
      setComments((prev) => [...prev, { text: payload.text, pending: true }]);
    },
  });

  return <Button title="Comment" onPress={() => mutateOffline({ postId, text })} />;
}
```

```tsx
// MessageBubble.tsx
function MessageBubble({ chatId }) {
  const { mutateOffline } = useOfflineMutation('SEND_MESSAGE', {
    handler: async (payload) => {
      await fetch(`/api/chats/${payload.chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: payload.text }),
      });
    },
    onOptimisticSuccess: (payload) => {
      addMessage({ text: payload.text, status: 'sending' });
    },
  });

  return <Button title="Send" onPress={() => mutateOffline({ chatId, text: message })} />;
}
```

Each `handler` is self-contained: when the user goes offline, actions are queued with their `actionName`. When connectivity returns, the queue flushes and each action runs through its registered handler automatically.

## Configuration

```tsx
interface OfflineManagerConfig {
  // Storage backend for persisting the queue
  storageType?: 'mmkv' | 'async-storage' | 'memory';
  storage?: StorageAdapter;       // Or pass a custom adapter

  // Sync behavior when connectivity restores
  syncMode?: 'auto' | 'manual';

  // Key used for storage persistence
  storageKey?: string;

  // Handler that processes each queued action during sync
  onSyncAction?: (action: OfflineAction) => Promise<void>;

  // Called when device goes online with pending items (manual mode only)
  onOnlineRestore?: (params: {
    pendingCount: number;
    syncNow: () => Promise<void>;
    discardQueue: () => Promise<void>;
  }) => void;
}
```

### Sync Modes

| Mode | Behavior |
|------|----------|
| `auto` | Queue is flushed silently as soon as connectivity returns |
| `manual` | `onOnlineRestore` callback fires — you decide what to show |

## Handling Online Restore (Manual Mode)

When `syncMode` is `'manual'`, you control what happens when the device goes back online. Set the `onOnlineRestore` callback in your config.

### Option A: Alert

```tsx
onOnlineRestore: ({ pendingCount, syncNow, discardQueue }) => {
  Alert.alert(
    'Back Online',
    `${pendingCount} pending operations. Sync now?`,
    [
      { text: 'Later', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discardQueue },
      { text: 'Sync', onPress: syncNow },
    ]
  );
},
```

### Option B: Toast

```tsx
import Toast from 'react-native-toast-message';

onOnlineRestore: ({ pendingCount, syncNow }) => {
  Toast.show({
    type: 'info',
    text1: 'Back online',
    text2: `Tap to sync ${pendingCount} pending operations`,
    onPress: () => {
      syncNow();
      Toast.hide();
    },
  });
},
```

### Option C: Bottom Sheet

```tsx
import { bottomSheetRef } from './BottomSheetController';

onOnlineRestore: ({ pendingCount, syncNow }) => {
  // Open your bottom sheet and pass sync controls
  bottomSheetRef.current?.present({ pendingCount, syncNow });
},
```

### Option D: Silent

Omit `onOnlineRestore` entirely. Nothing happens — you handle sync manually through the `useOfflineQueue` hook.

## Hooks

### `useOfflineMutation(actionName, options?)`

Queue-aware mutation hook. Calls the handler directly when online, queues when offline.

```tsx
const { mutateOffline } = useOfflineMutation('CREATE_POST', {
  handler: async (payload) => {
    // Your API call — runs directly when online, or during sync when offline
    await api.createPost(payload);
  },
  onOptimisticSuccess: (payload) => {
    // Runs immediately — update your local state here
  },
  onError: (error, payload) => {
    // Runs if the direct API call fails while online
  },
});

mutateOffline({ title: 'Hello', body: 'World' });
```

| Option | Type | Description |
|--------|------|-------------|
| `handler` | `(payload) => Promise<void>` | API call for this specific action. Registered automatically. |
| `onOptimisticSuccess` | `(payload) => void` | Fires immediately for instant UI updates |
| `onError` | `(error, payload) => void` | Fires if the direct call fails while online |

### `useOfflineQueue()`

Access the live queue state. Uses `useSyncExternalStore` under the hood — only re-renders when the queue actually changes.

```tsx
const { queue, pendingCount, isSyncing, syncNow, clearQueue } = useOfflineQueue();
```

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `OfflineAction[]` | Current queue contents |
| `pendingCount` | `number` | Number of pending items |
| `isSyncing` | `boolean` | Whether a sync is in progress |
| `syncNow` | `() => Promise<void>` | Trigger a manual sync |
| `clearQueue` | `() => Promise<void>` | Remove all queued items |

### `useNetworkStatus()`

Simple connectivity status.

```tsx
const { isOnline } = useNetworkStatus();
```

### `useSyncProgress()`

Live progress tracking during a sync session. Useful for building progress UIs inside sheets or modals.

```tsx
const {
  isActive,       // Is a sync session running?
  totalCount,     // Total items in this batch
  completedCount, // Successfully synced
  failedCount,    // Items that failed
  percentage,     // 0–100
  currentAction,  // The action being synced right now
  items,          // Per-item status: pending | syncing | success | failed
} = useSyncProgress();
```

**Example: Progress list inside a Bottom Sheet**

```tsx
{items.map((item) => (
  <View key={item.action.id} style={styles.row}>
    <Text>{item.status === 'success' ? '✅' : item.status === 'failed' ? '❌' : '⏳'}</Text>
    <Text>{item.action.actionName}</Text>
  </View>
))}
```

## Direct API Access

`OfflineManager` is a singleton accessible from anywhere — not just React components. Useful for background tasks, service layers, or testing.

```tsx
import { OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';

// Queue an action manually
await OfflineManager.push('SEND_MESSAGE', { text: 'hello' });

// Flush the queue
await OfflineManager.flushQueue();

// Read the queue
const items = OfflineManager.getQueue();

// Clear everything
await OfflineManager.clear();
```

## Background Sync

This package doesn't manage background tasks — that's platform-specific and depends on your setup. But `OfflineManager` works outside of React, so you can call it from any background task runner:

```tsx
import BackgroundFetch from 'react-native-background-fetch';
import { OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';

BackgroundFetch.configure({
  minimumFetchInterval: 15,
}, async (taskId) => {
  // Re-configure if the app was killed and relaunched
  await OfflineManager.configure({
    storageType: 'mmkv',
    onSyncAction: myApiHandler,
  });

  await OfflineManager.flushQueue();
  BackgroundFetch.finish(taskId);
});
```

This works with any background task library: `react-native-background-fetch`, `expo-task-manager`, iOS `BGTaskScheduler` via a native module, etc.

## Storage Adapters

### Built-in Adapters

| Adapter | Install | Limits | Best For |
|---------|---------|--------|----------|
| **MMKV** | `npm i react-native-mmkv` | ~**unlimited** (file-backed, grows dynamically). Per-value performance drops above ~256KB. | Small-to-medium queues (<1000 items). Fastest read/write. |
| **AsyncStorage** | `npm i @react-native-async-storage/async-storage` | Android: **6MB total** (default). iOS: no hard limit (SQLite). Per-value: **2MB on Android**. | Apps that already use AsyncStorage. |
| **Memory** | built-in | RAM only — **lost on app kill**. | Development, testing, or ephemeral queues. |

> **How much queue data is realistic?**
> A typical queued action is ~200–500 bytes (JSON). So 1000 queued actions ≈ 500KB — well within limits for both MMKV and AsyncStorage.
>
> If your queue could grow beyond 5000+ items or individual payloads exceed 1MB (e.g. base64 images), consider Realm or a custom SQLite adapter.

### Using a Built-in Adapter

```tsx
// MMKV (recommended)
<OfflineProvider config={{ storageType: 'mmkv', ... }} />

// AsyncStorage
<OfflineProvider config={{ storageType: 'async-storage', ... }} />

// In-memory (no persistence)
<OfflineProvider config={{ storageType: 'memory', ... }} />
```

### Custom Storage Adapter

Implement the `StorageAdapter` interface to use any storage backend:

```tsx
import { OfflineProvider, type StorageAdapter } from '@mustafaaksoy41/react-native-offline-queue';

const myStorage: StorageAdapter = {
  getItem: async (key) => { /* return string | null */ },
  setItem: async (key, value) => { /* persist string */ },
  removeItem: async (key) => { /* delete key */ },
};

<OfflineProvider config={{ storage: myStorage, syncMode: 'auto', onSyncAction: handler }}>
  <App />
</OfflineProvider>
```

### Realm Adapter (Built-in, Record-Based)

[Realm](https://www.mongodb.com/docs/realm/sdk/react-native/) stores each queue item as a separate database record. No JSON serialization overhead, no size limits, native query support.

```bash
npm install realm
cd ios && pod install
```

**Zero-config (default table created automatically):**

```tsx
<OfflineProvider config={{ storageType: 'realm', syncMode: 'auto', onSyncAction: handler }}>
  <App />
</OfflineProvider>
```

This automatically creates an `OfflineQueueItem` table in a dedicated `offline-queue.realm` file:

| Column | Type | Description |
|--------|------|-------------|
| `id` | string (PK) | Unique action ID |
| `actionName` | string | e.g. `'LIKE_POST'` |
| `payload` | string | JSON-stringified payload |
| `createdAt` | int | Timestamp |
| `retryCount` | int | Failed attempt count |

**With your own Realm instance (shared with your app's data):**

```tsx
import Realm from 'realm';
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

// Your app's Realm schemas + queue schema
const realm = await Realm.open({
  schema: [UserSchema, PostSchema, OfflineQueueItemSchema],
});

<OfflineProvider config={{
  storageType: 'realm',
  realmOptions: { realmInstance: realm },
  syncMode: 'auto',
  onSyncAction: handler,
}}>
  <App />
</OfflineProvider>
```

**Performance comparison:**

| Operation | MMKV (key-value) | Realm (record-based) |
|-----------|-------------------|----------------------|
| Push 1 item (100 items in queue) | Rewrite 100 items as JSON | Insert 1 record |
| Push 1 item (10,000 items in queue) | Rewrite 10,000 items as JSON | Insert 1 record |
| Remove 1 item | Rewrite entire queue | Delete 1 record |
| Load on startup | Parse entire JSON string | Read table records |

**When to use Realm over MMKV:**
- Queue can grow to 10,000+ items
- Individual payloads are large (>1MB)
- You need query/filter capabilities on the queue
- Your app already uses Realm for other data

## Types

```tsx
interface OfflineAction<TPayload = any> {
  id: string;
  actionName: string;
  payload: TPayload;
  createdAt: number;
  retryCount: number;
}

type SyncItemStatus = 'pending' | 'syncing' | 'success' | 'failed';

interface SyncProgressItem {
  action: OfflineAction;
  status: SyncItemStatus;
  error?: string;
}
```

## Sync Strategies

You have two ways to define how queued actions get synced. Use them together or pick one — the per-action handler always takes priority.

### Per-action handler (recommended)

Each mutation defines its own API call. The handler is registered automatically when the component mounts, and used during sync. This keeps the API logic next to the component that triggers it.

```tsx
const { mutateOffline } = useOfflineMutation('LIKE_POST', {
  handler: async (payload) => {
    await api.likePost(payload);
  },
});
```

### Global `onSyncAction` (fallback)

A catch-all function in the provider config. Useful as a fallback, or if you prefer managing all your API calls from one place.

```tsx
<OfflineProvider config={{
  storageType: 'mmkv',
  syncMode: 'auto',
  onSyncAction: async (action) => {
    switch (action.actionName) {
      case 'CREATE_POST':
        await api.createPost(action.payload);
        break;
      case 'DELETE_COMMENT':
        await api.deleteComment(action.payload);
        break;
    }
  },
}}>
```

### Resolution order

When the queue flushes, each action is resolved like this:

1. **Per-action handler** registered via `useOfflineMutation` → used if available
2. **Global `onSyncAction`** from provider config → used as fallback
3. **No handler found** → action fails with an error

## How It Works

The whole thing is built around a single `OfflineManager` singleton. It holds the queue in memory, persists it through whichever storage adapter you pick, and handles the sync logic.

`OfflineProvider` wraps your app and wires everything up: it listens for connectivity changes via NetInfo, configures the manager with your settings, and exposes the queue state to hooks.

From your components, you interact through hooks:

- **`useOfflineMutation`** — defines the API handler and pushes actions to the queue (or calls the handler directly if online)
- **`useOfflineQueue`** — reads the current queue state without unnecessary re-renders
- **`useSyncProgress`** — gives you per-item progress during a sync session

When the device comes back online, the manager either flushes the queue automatically or calls your `onOnlineRestore` callback, depending on the sync mode you chose. Each queued action is resolved through its registered handler first, then falls back to the global `onSyncAction`.

Storage is abstracted behind a simple `getItem` / `setItem` / `removeItem` interface, so swapping between MMKV, AsyncStorage, Realm, or your own backend is just a config change.

## License

MIT

---

<p align="center">Made with ❤️ by <a href="https://www.npmjs.com/~mustafaaksoy41">Mustafa Aksoy</a></p>
