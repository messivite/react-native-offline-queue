# React Query Example

Using `useOfflineMutation` alongside React Query's `useMutation` for offline support with cache management.

## Setup

```bash
npm install @tanstack/react-query
```

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

## Post Creation with Cache Update

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

function PostList() {
  const queryClient = useQueryClient();

  // Fetch posts with React Query
  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then((r) => r.json()),
  });

  // React Query mutation — handles API call, retry, cache invalidation
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
      await mutateAsync(payload);
    },
    onOptimisticSuccess: (payload) => {
      // Optimistic cache update
      queryClient.setQueryData(['posts'], (old: any[]) => [
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

## Like with Optimistic Toggle

```tsx
function LikeButton({ postId }) {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: () => fetch(`/api/posts/${postId}/like`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', postId] }),
  });

  const { mutateOffline, isQueued } = useOfflineMutation('LIKE_POST', {
    handler: async (payload) => await mutateAsync(),
    onOptimisticSuccess: () => {
      // Toggle like in cache immediately
      queryClient.setQueryData(['posts', postId], (old: any) => ({
        ...old,
        liked: !old.liked,
        likeCount: old.liked ? old.likeCount - 1 : old.likeCount + 1,
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
