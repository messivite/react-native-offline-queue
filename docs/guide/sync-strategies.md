# Sync Strategies

There are two ways to tell the queue how to process actions. You can use them together or pick one — the per-action handler always wins.

## Per-Action Handler (Recommended)

Each mutation defines its own API call. The handler is registered when the component first mounts and stays in the registry for the lifetime of the app.

```tsx
const { mutateOffline } = useOfflineMutation('CREATE_POST', {
  handler: async (payload) => {
    await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  onOptimisticSuccess: (payload) => {
    setPosts((prev) => [...prev, { ...payload, pending: true }]);
  },
});
```

**Why this is good:**
- API logic lives right next to the component that uses it
- No central file that grows with every new action
- Easy to understand — "this button calls this endpoint"
- Handler stays registered even after navigating away

## Global onSyncAction (Fallback)

A catch-all function you set in the provider config. Every action that doesn't have its own handler goes through here.

```tsx
<OfflineProvider config={{
  storageType: 'mmkv',
  syncMode: 'auto',
  onSyncAction: async (action) => {
    switch (action.actionName) {
      case 'LIKE_POST':
        await api.likePost(action.payload);
        break;
      case 'CREATE_POST':
        await api.createPost(action.payload);
        break;
      case 'DELETE_COMMENT':
        await api.deleteComment(action.payload);
        break;
    }
  },
}}>
```

**When to use this:**
- Small apps with a few actions
- When you want all API logic in one place
- As a fallback for actions that don't define per-action handlers

## Using Both Together

You can mix them. Per-action handlers take priority — the global `onSyncAction` only runs if no per-action handler exists for that action name.

```tsx
// App.tsx — fallback for anything without a per-action handler
<OfflineProvider config={{
  onSyncAction: async (action) => {
    await genericApiCall(action);
  },
}}>

// LikeButton.tsx — has its own handler, global is ignored
const { mutateOffline } = useOfflineMutation('LIKE_POST', {
  handler: async (payload) => await api.likePost(payload),
});

// DeleteButton.tsx — no handler, falls back to global
const { mutateOffline } = useOfflineMutation('DELETE_ITEM');
```

## Resolution Order

When the queue flushes, each action is resolved like this:

1. **Per-action handler** → used if registered via `useOfflineMutation`
2. **Global `onSyncAction`** → used as fallback
3. **Neither found** → action fails with `No handler registered for action: ACTION_NAME`
