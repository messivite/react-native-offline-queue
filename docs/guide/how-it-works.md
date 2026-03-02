# How It Works

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Your App                    │
│                                             │
│  useOfflineMutation ──┐                     │
│  useOfflineQueue ─────┤                     │
│  useSyncProgress ─────┤                     │
│  useNetworkStatus ────┤                     │
│                       ▼                     │
│              OfflineProvider                │
│              (NetInfo listener)             │
└───────────────┬─────────────────────────────┘
                │
                ▼
        OfflineManager (singleton)
        ┌──────────────────────┐
        │  Queue (in-memory)   │
        │  ┌────────────────┐  │
        │  │ StorageAdapter │  │  ← MMKV / AsyncStorage / Realm / Memory
        │  └────────────────┘  │
        │  flushQueue()        │  ← Calls onSyncAction for each item
        │  handleOnlineRestore │  ← auto: flush / manual: callback
        └──────────────────────┘
```

## Mutation Flow

When a user performs an action (like tapping a "Like" button):

### Online Path
```
User taps → useOfflineMutation → Online? YES
                                      ↓
                              Direct API call
                                    / \
                                 ✅    ❌
                              success  fallback → queue
```

### Offline Path
```
User taps → useOfflineMutation → Online? NO
                                      ↓
                              Push to queue
                                      ↓
                              Optimistic UI update
                                      ↓
                              (waiting for internet)
                                      ↓
                              Internet restored
                                      ↓
                       ┌──────────────┴──────────────┐
                   auto mode                    manual mode
                       ↓                             ↓
                 flushQueue()              onOnlineRestore callback
                                           (Alert/Toast/Sheet)
```

## Queue Persistence

The queue is kept in memory for fast access and simultaneously persisted to your chosen storage adapter:

| Adapter Type | How It Works |
|---|---|
| **Key-Value** (MMKV, AsyncStorage) | Entire queue serialized as one JSON string |
| **Record-Based** (Realm) | Each queue item is a separate database record |

The record-based approach is more performant for large queues because adding/removing one item doesn't require rewriting the entire queue.

## Sync Progress

During a sync session, each item goes through these states:

```
pending → syncing → success
                  → failed (retryCount incremented)
```

The `useSyncProgress` hook provides real-time visibility into this process, enabling custom progress UIs.
