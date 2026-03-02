# OfflineManager

A singleton class accessible from anywhere — not just React components. Useful for background tasks, service layers, or testing.

```tsx
import { OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';
```

## Methods

### configure(config)

Initialize the manager with storage, sync mode, and handlers.

```tsx
await OfflineManager.configure({
  storageType: 'mmkv',
  syncMode: 'manual',
  onSyncAction: async (action) => { /* fallback API call */ },
  onOnlineRestore: ({ pendingCount, syncNow, discardQueue }) => { /* UI */ },
});
```

### push(actionName, payload)

Add an action to the queue.

```tsx
const action = await OfflineManager.push('SEND_MESSAGE', { text: 'hello' });
// Returns: OfflineAction { id, actionName, payload, createdAt, retryCount }
```

### remove(id)

Remove a specific action from the queue.

```tsx
await OfflineManager.remove('action-uuid-here');
```

### clear()

Remove all actions from the queue and reset progress.

```tsx
await OfflineManager.clear();
```

### getQueue()

Get the current in-memory queue.

```tsx
const items: OfflineAction[] = OfflineManager.getQueue();
```

### flushQueue()

Process all queued actions. For each action, looks up its per-action handler first, then falls back to `onSyncAction`. Tracks progress and removes successful items.

```tsx
await OfflineManager.flushQueue();
```

### registerHandler(actionName, handler)

Register a per-action handler. Called automatically by `useOfflineMutation` when `handler` option is provided.

```tsx
OfflineManager.registerHandler('LIKE_POST', async (payload) => {
  await api.likePost(payload);
});
```

### unregisterHandler(actionName)

Remove a per-action handler from the registry.

```tsx
OfflineManager.unregisterHandler('LIKE_POST');
```

### getHandler(actionName)

Look up a registered handler.

```tsx
const handler = OfflineManager.getHandler('LIKE_POST');
// Returns: ((payload) => Promise<void>) | undefined
```

### setOnline(online)

Update the network status. Called internally by `OfflineProvider`. Notifies only if the value actually changed.

```tsx
OfflineManager.setOnline(true);
```

### handleOnlineRestore()

Called internally by `OfflineProvider` when network restores.

- **Auto mode**: Calls `flushQueue()` immediately
- **Manual mode + onOnlineRestore**: Calls the callback
- **Manual mode (silent)**: Does nothing

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `isInitialized` | `boolean` | Whether `configure()` has been called |
| `isOnline` | `boolean \| null` | Current network status |
| `syncMode` | `'auto' \| 'manual'` | Current sync mode |
| `isSyncing` | `boolean` | Whether a flush is in progress |
| `syncProgress` | `SyncProgress` | Current sync progress state |
| `onSyncAction` | `function` | The configured global sync handler |

## Subscriptions

For `useSyncExternalStore` integration:

```tsx
// Subscribe to queue changes
const unsub1 = OfflineManager.subscribeQueue(() => {
  console.log('Queue changed:', OfflineManager.getQueue());
});

// Subscribe to progress changes
const unsub2 = OfflineManager.subscribeProgress(() => {
  console.log('Progress:', OfflineManager.syncProgress);
});

// Subscribe to network changes
const unsub3 = OfflineManager.subscribeNetwork(() => {
  console.log('Network:', OfflineManager.isOnline);
});
```
