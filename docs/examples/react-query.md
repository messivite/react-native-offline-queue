# 3. React Query — Offline + Cache Management

If you use **TanStack Query (React Query)** for data fetching, this example shows how to combine it with offline queue. The key idea: **handler calls `mutateAsync`** — no duplicate API logic.

## Why Combine Them?

- **React Query** — Fetches data, caches it, invalidates on mutation
- **Offline Queue** — Queues mutations when offline, syncs when online
- **Together** — Handler calls `mutateAsync` → one mutation does both: API call + cache invalidation

## Installation

```bash
npm install @tanstack/react-query
```

## Step 1: Provider Setup

Wrap with both QueryClientProvider and OfflineProvider:

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineProvider config={{ storageType: 'mmkv', syncMode: 'auto' }}>
        <YourApp />
      </OfflineProvider>
    </QueryClientProvider>
  );
}
```

## Step 2: Create Post with Optimistic Cache Update

When the user creates a post:
- **Online:** `mutateAsync` runs → API call → cache invalidated
- **Offline:** Action queued → optimistic update adds fake post to cache → when sync runs, `mutateAsync` is called

```tsx
import { View, FlatList, Text, Button } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

function PostList() {
  const queryClient = useQueryClient();

  // Fetch posts (your existing React Query setup)
  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then((r) => r.json()),
  });

  // React Query mutation — handles API, retry, cache invalidation
  const { mutateAsync } = useMutation({
    mutationFn: (payload: { title: string; body: string }) =>
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Offline wrapper — queues when offline, calls mutateAsync when online
  const { mutateOffline, isQueued, isLoading } = useOfflineMutation('CREATE_POST', {
    handler: async (payload) => {
      await mutateAsync(payload); // Same mutation, no duplicate fetch
    },
    onOptimisticSuccess: (payload) => {
      // Add temporary post to cache so UI updates instantly
      queryClient.setQueryData(['posts'], (old: any[] = []) => [
        ...old,
        { ...payload, id: `temp-${Date.now()}`, pending: true },
      ]);
    },
  });

  return (
    <View>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <View style={{ opacity: item.pending ? 0.5 : 1 }}>
            <Text>{item.title}</Text>
            {item.pending && <Text>📡 Syncing...</Text>}
          </View>
        )}
      />
      <Button
        title={isLoading ? '⏳' : isQueued ? '📡 Queued' : '+ New Post'}
        onPress={() => mutateOffline({ title: 'My Post', body: 'Content here' })}
      />
    </View>
  );
}
```

## Step 3: Like Button with Optimistic Toggle

For a Like button, we update the cache immediately (toggle like state) instead of invalidating:

```tsx
function LikeButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => fetch(`/api/posts/${postId}/like`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', postId] }),
  });

  const { mutateOffline, isQueued } = useOfflineMutation('LIKE_POST', {
    handler: async () => await mutateAsync(),
    onOptimisticSuccess: () => {
      // Toggle like in cache immediately (optimistic)
      queryClient.setQueryData(['posts', postId], (old: any) => ({
        ...old,
        liked: !old?.liked,
        likeCount: old?.liked ? old.likeCount - 1 : (old?.likeCount || 0) + 1,
      }));
    },
  });

  return (
    <Button
      title={isQueued ? '📡' : '❤️'}
      onPress={() => mutateOffline({ postId })}
    />
  );
}
```

## Pattern Summary

| What | Where |
|------|-------|
| API call, retry, cache invalidation | `useMutation` (React Query) |
| Offline queue, optimistic UI trigger | `useOfflineMutation` |
| Handler body | `await mutateAsync(payload)` — single source of truth |

**Next:** [Realm Storage →](/examples/realm) — For large queues or when you already use Realm
