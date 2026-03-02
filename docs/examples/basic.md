# 2. Basic — Full-Featured Example

A complete example with **persistent storage (MMKV)**, **multiple mutations**, and **network status UI**. Use this as a template for real apps.

## What We'll Build

1. **App setup** — OfflineProvider with MMKV (survives app restart)
2. **Two mutations** — Like post + Send message (each with its own handler)
3. **Network banner** — Show online/offline status
4. **Sync progress** — Show "Syncing... 45%" during queue flush
5. **Manual sync button** — Let user trigger sync on demand

## Prerequisites

```bash
npm install react-native-mmkv
cd ios && pod install
```

## Step 1: App Setup

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  return (
    <OfflineProvider config={{ storageType: 'mmkv', syncMode: 'auto' }}>
      <HomeScreen />
    </OfflineProvider>
  );
}
```

::: info
- **`storageType: 'mmkv'`** — Fast, persistent. Queue survives app restart.
- **`syncMode: 'auto'`** — Queue flushes automatically when connectivity returns. Use `'manual'` if you want to show a prompt (e.g. "Sync 3 pending items?").
:::

## Step 2: HomeScreen with Multiple Mutations

Each mutation defines its **own API handler**. No central switch-case — logic stays next to the component.

```tsx
// screens/HomeScreen.tsx
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import {
  useOfflineMutation,
  useOfflineQueue,
  useNetworkStatus,
  useSyncProgress,
} from '@mustafaaksoy41/react-native-offline-queue';

export default function HomeScreen() {
  const { isOnline } = useNetworkStatus();
  const { pendingCount, syncNow } = useOfflineQueue();
  const { isActive, percentage } = useSyncProgress();
  const [liked, setLiked] = useState(false);

  // Mutation 1: Like post
  const { mutateOffline: likePost, isLoading, isQueued } = useOfflineMutation('LIKE_POST', {
    handler: async (payload) => {
      const res = await fetch(`https://api.myapp.com/posts/${payload.postId}/like`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onOptimisticSuccess: () => setLiked(true),
  });

  // Mutation 2: Send message
  const { mutateOffline: sendMessage } = useOfflineMutation('SEND_MESSAGE', {
    handler: async (payload) => {
      await fetch('https://api.myapp.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
    onOptimisticSuccess: (payload) => {
      console.log('Message queued/sent:', payload.text);
    },
  });

  return (
    <View style={{ padding: 20 }}>
      {/* Network status */}
      <Text>{isOnline === null ? '⏳ Detecting...' : isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
      <Text>Pending: {pendingCount}</Text>

      {/* Sync progress (shows during queue flush) */}
      {isActive && <Text>Syncing... {percentage}%</Text>}

      {/* Like button with state */}
      <Button
        title={isLoading ? '⏳ Sending...' : isQueued ? '📡 Queued' : liked ? '❤️ Liked' : '🤍 Like'}
        onPress={() => likePost({ postId: 42 })}
        disabled={isLoading}
      />

      <Button
        title="Send Message"
        onPress={() => sendMessage({ text: 'Hello!', userId: 1 })}
      />

      {/* Manual sync (useful in manual mode) */}
      <Button
        title={`Sync Now (${pendingCount})`}
        onPress={syncNow}
        disabled={pendingCount === 0}
      />
    </View>
  );
}
```

## Hooks Used

| Hook | Purpose |
|------|---------|
| `useNetworkStatus()` | `isOnline` — reactive connectivity status |
| `useOfflineQueue()` | `pendingCount`, `syncNow`, `clearQueue` |
| `useSyncProgress()` | `isActive`, `percentage` — live progress during sync |
| `useOfflineMutation()` | `mutateOffline`, `isLoading`, `isQueued` — per-mutation state |

## Flow Summary

1. **Online:** User taps Like → `handler` runs → API called → `onOptimisticSuccess` → UI updates
2. **Offline:** User taps Like → action queued → `onOptimisticSuccess` → UI updates instantly (optimistic)
3. **Back online:** Queue flushes in background → `isActive` / `percentage` update → each `handler` runs

**Next:** [React Query →](/examples/react-query) — Integrate with TanStack Query for cache invalidation
