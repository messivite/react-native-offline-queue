# 1. Minimal — Up and Running in 5 Minutes

The simplest possible example. A single Like button, one mutation. Perfect for understanding the core concept.

## What We'll Build

- User taps Like while **offline** → action is queued
- When back **online** → queue syncs automatically
- **Storage:** Memory (no setup, data is lost on app restart — fine for learning)

## Step 1: Wrap with Provider

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

export default function App() {
  return (
    <OfflineProvider config={{ storageType: 'memory', syncMode: 'auto' }}>
      <LikeButton />
    </OfflineProvider>
  );
}
```

::: tip
`storageType: 'memory'` — No extra packages, but the queue is lost when the app restarts. For real apps, use `mmkv` or `async-storage`.
:::

## Step 2: Use the Mutation Hook

```tsx
// LikeButton.tsx
import { useState } from 'react';
import { Button } from 'react-native';
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

export function LikeButton() {
  const [liked, setLiked] = useState(false);

  const { mutateOffline, isQueued } = useOfflineMutation('LIKE_POST', {
    handler: async (payload) => {
      const res = await fetch(`https://api.example.com/posts/${payload.postId}/like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed');
    },
    onOptimisticSuccess: () => setLiked(true), // UI updates instantly
  });

  return (
    <Button
      title={isQueued ? '📡 Queued' : liked ? '❤️ Liked' : '🤍 Like'}
      onPress={() => mutateOffline({ postId: 42 })}
    />
  );
}
```

## How It Works

| Scenario | What happens |
|----------|--------------|
| **Online + tap** | `handler` runs immediately → API request is sent → `onOptimisticSuccess` fires |
| **Offline + tap** | Action is queued → `onOptimisticSuccess` still fires (optimistic UI) → UI updates instantly |
| **Back online** | Queue syncs automatically (`syncMode: 'auto'`) → `handler` runs for each queued action |

## Summary

- **`handler`** — The real API call (runs when online or during sync)
- **`onOptimisticSuccess`** — Update UI immediately (user never waits)
- **`isQueued`** — Is the action in the queue? (for showing 📡)

**Next:** [Basic Usage →](/examples/basic) — Multiple mutations, persistent storage, network status
