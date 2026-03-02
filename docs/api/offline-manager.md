# OfflineManager

A singleton class accessible from anywhere — not just React components. Useful for background tasks, service layers, or testing.

```tsx
import { OfflineManager } from 'react-native-offline-queue';
```

## Methods

### configure(config)

Initialize the manager with storage, sync mode, and handlers.

```tsx
await OfflineManager.configure({
  storageType: 'mmkv',
  syncMode: 'manual',
  onSyncAction: async (action) => { /* API call */ },
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

Process all queued actions by calling `onSyncAction` for each one. Tracks progress and removes successful items.

```tsx
await OfflineManager.flushQueue();
```

### handleOnlineRestore()

Called internally by `OfflineProvider` when network restores. You typically don't call this directly.

- **Auto mode**: Calls `flushQueue()` immediately
- **Manual mode + onOnlineRestore**: Calls the callback
- **Manual mode (silent)**: Does nothing

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `isInitialized` | `boolean` | Whether `configure()` has been called |
| `syncMode` | `'auto' \| 'manual'` | Current sync mode |
| `isSyncing` | `boolean` | Whether a flush is in progress |
| `syncProgress` | `SyncProgress` | Current sync progress state |
| `onSyncAction` | `function` | The configured sync handler |

## Subscriptions

For `useSyncExternalStore` integration:

```tsx
// Subscribe to queue changes
const unsubscribe = OfflineManager.subscribeQueue(() => {
  console.log('Queue changed:', OfflineManager.getQueue());
});

// Subscribe to progress changes
const unsubscribe = OfflineManager.subscribeProgress(() => {
  console.log('Progress:', OfflineManager.syncProgress);
});
```
