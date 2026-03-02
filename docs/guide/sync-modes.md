# Sync Modes

## Overview

| Mode | Behavior |
|------|----------|
| `auto` | Queue is flushed silently as soon as connectivity returns |
| `manual` | `onOnlineRestore` callback fires — you decide what to show |

## Auto Mode

```tsx
<OfflineProvider config={{
  syncMode: 'auto',
  onSyncAction: myHandler,
}}>
```

When the device goes back online, all queued actions are synced silently in the background. No user interaction required.

## Manual Mode

```tsx
<OfflineProvider config={{
  syncMode: 'manual',
  onSyncAction: myHandler,
  onOnlineRestore: ({ pendingCount, syncNow, discardQueue }) => {
    // Your custom UI here
  },
}}>
```

When the device goes back online, your `onOnlineRestore` callback is called with:

| Parameter | Type | Description |
|-----------|------|-------------|
| `pendingCount` | `number` | Number of queued items |
| `syncNow` | `() => Promise<void>` | Call to start syncing |
| `discardQueue` | `() => Promise<void>` | Call to discard all items |

### Silent Manual Mode

If you omit `onOnlineRestore`, nothing happens — you handle sync manually via the `useOfflineQueue` hook.
