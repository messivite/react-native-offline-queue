# Getting Started

## Installation

```bash
npm install @mustafaaksoy41/react-native-offline-queue

# Required peer dependency
npm install @react-native-community/netinfo

# Pick ONE storage adapter (optional — defaults to in-memory)
npm install react-native-mmkv           # Recommended: fast, synchronous
# OR
npm install @react-native-async-storage/async-storage
# OR
npm install realm                        # For large queues
```

### iOS

```bash
cd ios && pod install
```

## Quick Setup

### 1. Wrap your app with OfflineProvider

```tsx
// App.tsx
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';

export default function App() {
  return (
    <OfflineProvider config={{ storageType: 'mmkv', syncMode: 'auto' }}>
      <YourApp />
    </OfflineProvider>
  );
}
```

### 2. Use mutations in your components

Each mutation defines its own API handler. When online, the handler runs immediately. When offline, the action is queued and the handler runs during sync.

```tsx
import { useOfflineMutation } from '@mustafaaksoy41/react-native-offline-queue';

function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  const { mutateOffline, isLoading, isQueued } = useOfflineMutation('LIKE_POST', {
    handler: async (payload) => {
      await fetch('https://api.example.com/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
    onOptimisticSuccess: () => setLiked(true),
  });

  return (
    <Button
      title={isLoading ? '⏳' : isQueued ? '📡' : liked ? '❤️' : '🤍'}
      onPress={() => mutateOffline({ postId })}
      disabled={isLoading}
    />
  );
}
```

### What happens

| User action | Network | Result |
|-------------|---------|--------|
| Button press | Online | `handler` runs → API call fires → `onOptimisticSuccess` |
| Button press | Offline | Action queued → `onOptimisticSuccess` → UI updates instantly |
| Connectivity restores | — | Queue flushes → each `handler` runs → real API calls sent |

## Next Steps

- [How It Works](/guide/how-it-works) — What happens under the hood
- [Sync Strategies](/guide/sync-strategies) — Per-action handlers vs global onSyncAction
- [React Query Integration](/guide/react-query) — Using mutateAsync inside handlers
- [Storage Adapters](/guide/storage-adapters) — MMKV vs AsyncStorage vs Realm
