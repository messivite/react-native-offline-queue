# Hooks

## useOfflineMutation

Queue-aware mutation hook. Calls the API directly when online, queues when offline.

```tsx
const { mutateOffline } = useOfflineMutation<PayloadType>(actionName, options?)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `actionName` | `string` | Identifier for this action type (e.g. `'LIKE_POST'`) |
| `options.onOptimisticSuccess` | `(payload) => void` | Called immediately — update local state here |
| `options.onError` | `(error, payload) => void` | Called if direct API call fails while online |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `mutateOffline` | `(payload: T) => Promise<void>` | Execute the mutation |

### Behavior

| Network | What Happens |
|---------|--------------|
| Online | Direct API call via `onSyncAction` → success → `onOptimisticSuccess` |
| Online (API fails) | Falls back to queue → `onOptimisticSuccess` + `onError` |
| Offline | Push to queue → `onOptimisticSuccess` |

---

## useOfflineQueue

Access the live queue state.

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

Simple connectivity status from the `OfflineProvider` context.

```tsx
const { isOnline } = useNetworkStatus()
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isOnline` | `boolean \| null` | `true` if connected, `false` if not, `null` if unknown |

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
