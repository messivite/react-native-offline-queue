# How It Works

## The Big Picture

Everything revolves around a single `OfflineManager` singleton. It's just a class instance that lives for the entire app lifecycle. It holds the queue in memory, persists it to storage, and runs the sync logic.

Your components never talk to `OfflineManager` directly — they use hooks. The hooks read from the manager's internal stores via `useSyncExternalStore`, which means React only re-renders the components that actually care about the data that changed.

## What happens when the user taps a button

Let's say you have a "Like" button:

```tsx
const { mutateOffline, isLoading, isQueued } = useOfflineMutation('LIKE_POST', {
  handler: async (payload) => {
    await api.likePost(payload);
  },
  onOptimisticSuccess: () => setLiked(true),
});
```

### When the user is online

1. User taps → `mutateOffline({ postId: 42 })` is called
2. Hook detects the device is online
3. `handler(payload)` runs immediately — your real API call fires
4. If it succeeds → `onOptimisticSuccess` fires, `status` becomes `'success'`
5. If it fails → action is pushed to the queue as a fallback, `status` becomes `'queued'`

### When the user is offline

1. User taps → `mutateOffline({ postId: 42 })` is called
2. Hook detects the device is offline
3. Action is pushed to the queue: `{ actionName: 'LIKE_POST', payload: { postId: 42 } }`
4. Queue is persisted to storage (MMKV, AsyncStorage, etc.)
5. `onOptimisticSuccess` fires → UI updates immediately
6. `status` becomes `'queued'`

No API call happens. The action just waits.

### When connectivity returns

1. `OfflineProvider` detects network change via NetInfo
2. Depending on `syncMode`:
   - **auto** → `flushQueue()` runs immediately, silently
   - **manual** → your `onOnlineRestore` callback fires (you show an Alert, Toast, etc.)
3. `flushQueue()` loops through every queued action
4. For each action, it looks up the handler: per-action handler first, then `onSyncAction` fallback
5. Success → action removed from queue. Failure → `retryCount` incremented, stays in queue.

## How handler resolution works

When the queue flushes, each action needs to find its handler. The resolution order is:

```tsx
// 1. Check per-action handler registry
const handler = actionHandlers.get(action.actionName);

// 2. If not found, fall back to global onSyncAction
if (!handler && onSyncAction) {
  onSyncAction(action);
}

// 3. Neither exists? Action fails with an error.
```

Per-action handlers are registered automatically when `useOfflineMutation` mounts with a `handler` option. They persist even after the component unmounts — so if the user navigates away from a screen, the handler is still available for sync.

## How storage works

The queue lives in memory (a plain array) for fast access. Every time it changes — push, remove, clear — it's also persisted to your storage adapter.

There are two types of adapters:

**Key-value** (MMKV, AsyncStorage, Memory): The entire queue is serialized as one JSON string. Simple, but every write rewrites the whole queue.

```tsx
// What happens internally
await storage.setItem('OFFLINE_QUEUE', JSON.stringify(queue));
```

**Record-based** (Realm): Each action is a separate database record. Adding or removing one item doesn't touch the rest. Much better for large queues.

```tsx
// What happens internally
await realm.create('OfflineQueueItem', action);
```

## Why useSyncExternalStore

Every hook in this package — `useNetworkStatus`, `useOfflineQueue`, `useSyncProgress` — reads from a store on the `OfflineManager` singleton using React's `useSyncExternalStore`.

This matters because:

- **No Context cascading.** When `isOnline` changes, only components that call `useNetworkStatus()` re-render. Everything else is untouched.
- **No unnecessary renders.** If the queue changes, only `useOfflineQueue()` consumers re-render. Network status consumers don't.
- **Works outside React.** `OfflineManager` is a plain class. You can read `OfflineManager.isOnline` or call `OfflineManager.flushQueue()` from background tasks, service layers, or anywhere.

Compare this to a typical Context approach where changing one value re-renders every component inside the Provider.

## Mutation state lifecycle

Each `useOfflineMutation` call tracks its own `status`:

| Scenario | Flow |
|----------|------|
| Online, API succeeds | `idle` → `loading` → `success` |
| Online, API fails | `idle` → `loading` → `queued` (action saved as fallback) |
| Offline | `idle` → `queued` (action saved, UI updates optimistically) |

You can use `reset()` to go back to `idle` at any time.
