# Sync Progress

Track each item in real-time as it syncs. Build progress bars, item lists, and custom sync UIs.

## useSyncProgress Hook

```tsx
const {
  isActive,       // Is a sync session running?
  totalCount,     // Total items in this batch
  completedCount, // Successfully synced
  failedCount,    // Items that failed
  percentage,     // 0–100
  currentAction,  // The action being synced right now
  items,          // Per-item status array
} = useSyncProgress();
```

## Item Status Flow

```
pending → syncing → success
                  → failed
```

Each item in the `items` array has:

| Field | Type | Description |
|-------|------|-------------|
| `action` | `OfflineAction` | The queued action |
| `status` | `'pending' \| 'syncing' \| 'success' \| 'failed'` | Current state |
| `error` | `string?` | Error message if failed |

## Example: Progress UI

```tsx
function SyncProgressTracker() {
  const { isActive, percentage, items, completedCount, totalCount } = useSyncProgress();

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <Text>Syncing {completedCount}/{totalCount}</Text>
      <ProgressBar progress={percentage / 100} />
      
      {items.map((item) => (
        <View key={item.action.id} style={styles.row}>
          <Text>
            {item.status === 'pending' && '⏳'}
            {item.status === 'syncing' && '🔄'}
            {item.status === 'success' && '✅'}
            {item.status === 'failed' && '❌'}
          </Text>
          <Text>{item.action.actionName}</Text>
          {item.error && <Text style={styles.error}>{item.error}</Text>}
        </View>
      ))}
    </View>
  );
}
```

::: tip Zero Re-renders
`useSyncProgress` uses `useSyncExternalStore` internally. Components only re-render when progress actually changes — not on every state update in your app.
:::
