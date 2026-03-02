# React Query Integration

This package works alongside React Query (TanStack Query). You don't need to choose between them — they complement each other.

## The Pattern

Your existing `useMutation` handles the API call, retry logic, cache invalidation — all the React Query goodness. The `handler` in `useOfflineMutation` just calls `mutateAsync` from your mutation.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

function CreatePostForm() {
  const queryClient = useQueryClient();

  // Your existing React Query mutation
  const { mutateAsync } = useMutation({
    mutationFn: (payload: { title: string; body: string }) =>
      fetch('https://api.myapp.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Offline queue wraps the mutation
  const { mutateOffline, isQueued } = useOfflineMutation('CREATE_POST', {
    handler: async (payload) => {
      await mutateAsync(payload);
    },
    onOptimisticSuccess: (payload) => {
      // Update cache immediately
      queryClient.setQueryData(['posts'], (old: any) =>
        old ? [...old, { ...payload, id: 'temp', pending: true }] : [payload]
      );
    },
  });

  return (
    <Button
      title={isQueued ? '📡 Queued' : 'Submit'}
      onPress={() => mutateOffline({ title, body })}
    />
  );
}
```

## With Custom Hooks

If your mutations live in reusable hooks:

```tsx
// hooks/useCreatePost.ts
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

// CreatePostForm.tsx
function CreatePostForm() {
  const { mutateAsync } = useCreatePost();

  const { mutateOffline } = useOfflineMutation('CREATE_POST', {
    handler: async (payload) => await mutateAsync(payload),
    onOptimisticSuccess: (payload) => { /* update cache */ },
  });

  return <Button onPress={() => mutateOffline({ title, body })} />;
}
```

## What Runs Where

| Responsibility | Who handles it |
|----------------|----------------|
| API call (fetch/axios) | React Query `mutationFn` |
| Retry logic | React Query `retry` option |
| Cache invalidation | React Query `onSuccess` |
| Offline queueing | `useOfflineMutation` |
| Optimistic UI updates | `onOptimisticSuccess` |
| Sync when back online | `OfflineManager.flushQueue()` |

## State Comparison

| State | `useOfflineMutation` | React Query `useMutation` |
|-------|---------------------|---------------------------|
| Loading | `isLoading` | `isPending` |
| Success | `isSuccess` | `isSuccess` |
| Error | `isError` | `isError` |
| Queued offline | `isQueued` ✅ | ❌ (not aware of offline) |
| Reset | `reset()` | `reset()` |

The key difference: React Query doesn't know about offline. It would just fail silently or throw. `useOfflineMutation` catches that and queues the action instead.
