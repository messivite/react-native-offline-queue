# Hooks

## useOfflineMutation

Queue-aware mutation hook with built-in state tracking.

```tsx
const {
  mutateOffline,
  status,
  isIdle,
  isLoading,
  isSuccess,
  isError,
  isQueued,
  error,
  reset,
} = useOfflineMutation<PayloadType>(actionName, options?)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `actionName` | `string` | Unique identifier for this action (e.g. `'LIKE_POST'`) |
| `options.handler` | `(payload) => Promise<void>` | API call for this action. Registered automatically, used during sync. |
| `options.onOptimisticSuccess` | `(payload) => void` | Fires immediately — update local state here |
| `options.onSuccess` | `(payload) => void` | Fires only after a successful direct call (online) |
| `options.onError` | `(error, payload) => void` | Fires if the direct API call fails while online |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `mutateOffline` | `(payload: T) => Promise<void>` | Execute the mutation |
| `status` | `MutationStatus` | `'idle' \| 'loading' \| 'success' \| 'error' \| 'queued'` |
| `isIdle` | `boolean` | `true` before any mutation |
| `isLoading` | `boolean` | `true` while the handler is running (online only) |
| `isSuccess` | `boolean` | `true` after a successful direct call |
| `isError` | `boolean` | `true` if the direct call threw |
| `isQueued` | `boolean` | `true` when action was added to the offline queue |
| `error` | `Error \| null` | The error that occurred, if any |
| `reset` | `() => void` | Reset status back to `'idle'` |

### State Flow

| Scenario | Status |
|----------|--------|
| Online + success | `idle` → `loading` → `success` |
| Online + API fails | `idle` → `loading` → `queued` |
| Offline | `idle` → `queued` |

### Example

```tsx
function LikeButton({ postId }) {
  const { mutateOffline, isLoading, isQueued } = useOfflineMutation('LIKE_POST', {
    handler: async (payload) => {
      await fetch('/api/likes', { method: 'POST', body: JSON.stringify(payload) });
    },
    onOptimisticSuccess: () => setLiked(true),
  });

  return (
    <Button
      title={isLoading ? '⏳' : isQueued ? '📡 Queued' : '❤️ Like'}
      onPress={() => mutateOffline({ postId })}
      disabled={isLoading}
    />
  );
}
```

---

## useOfflineQueue

Access the live queue state. Built on `useSyncExternalStore` — only re-renders when the queue actually changes.

```tsx
const { queue, pendingCount, isSyncing, syncNow, clearQueue } = useOfflineQueue()
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `OfflineAction[]` | Current queue contents |
| `pendingCount` | `number` | Number of pending items |
| `isSyncing` | `boolean` | Whether a sync is in progress |
| `syncNow` | `() => Promise<void>` | Trigger a manual sync |
| `clearQueue` | `() => Promise<void>` | Remove all queued items |

---

## useNetworkStatus

Reactive connectivity status. Built on `useSyncExternalStore` — no Context, no cascading re-renders.

```tsx
const { isOnline } = useNetworkStatus()
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isOnline` | `boolean \| null` | `true` = online, `false` = offline, `null` = not yet detected |

::: tip Re-render guarantee
If your component doesn't call `useNetworkStatus()`, it will **never** re-render due to connectivity changes. Only subscribers re-render.
:::

### Example

```tsx
function ConnectionBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline !== false) return null;

  return (
    <View style={{ backgroundColor: '#ff4444', padding: 8 }}>
      <Text style={{ color: 'white', textAlign: 'center' }}>
        📴 You are offline
      </Text>
    </View>
  );
}
```

---

## useSyncProgress

Live progress tracking during a sync session.

```tsx
const progress = useSyncProgress()
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isActive` | `boolean` | Is a sync session running? |
| `totalCount` | `number` | Total items in this batch |
| `completedCount` | `number` | Successfully synced |
| `failedCount` | `number` | Items that failed |
| `percentage` | `number` | 0–100 |
| `currentAction` | `OfflineAction \| null` | The action being synced right now |
| `items` | `SyncProgressItem[]` | Per-item status array |

### Example

```tsx
function SyncProgressUI() {
  const { isActive, percentage, items } = useSyncProgress();

  if (!isActive) return null;

  return (
    <View>
      <Text>Syncing... {percentage}%</Text>
      {items.map((item) => (
        <Text key={item.action.id}>
          {item.status === 'success' ? '✅' : item.status === 'failed' ? '❌' : '⏳'}
          {' '}{item.action.actionName}
        </Text>
      ))}
    </View>
  );
}
```
