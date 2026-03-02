# Getting Started

## Installation

```bash
npm install react-native-offline-queue

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
import { OfflineProvider } from 'react-native-offline-queue';

const offlineConfig = {
  storageType: 'mmkv',
  syncMode: 'manual',
  onSyncAction: async (action) => {
    await fetch(`https://api.example.com/${action.actionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.payload),
    });
  },
};

export default function App() {
  return (
    <OfflineProvider config={offlineConfig}>
      <YourApp />
    </OfflineProvider>
  );
}
```

### 2. Use mutations in your components

```tsx
import { useOfflineMutation } from 'react-native-offline-queue';

function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  const { mutateOffline } = useOfflineMutation('LIKE_POST', {
    onOptimisticSuccess: () => setLiked(true),
  });

  return (
    <Button
      title={liked ? '❤️' : '🤍'}
      onPress={() => mutateOffline({ postId })}
    />
  );
}
```

### How it works

- **Online**: The API call executes immediately. No queue involved.
- **Offline**: The action is saved to the queue, and `onOptimisticSuccess` fires so the UI updates instantly.
- **When connectivity returns**: Queued actions are synced based on your `syncMode`.

## Next Steps

- [How It Works](/guide/how-it-works) — Architecture overview
- [Storage Adapters](/guide/storage-adapters) — MMKV vs AsyncStorage vs Realm
- [Sync Modes](/guide/sync-modes) — Auto vs Manual
