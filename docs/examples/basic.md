# Basic Usage

A complete example with MMKV storage, per-action handlers, and state tracking.

## App Setup

```tsx
// App.tsx
import React from 'react';
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

## Component with Mutations

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

  // Each mutation defines its own API call
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
      <Text>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
      <Text>Pending: {pendingCount}</Text>

      {/* Sync progress */}
      {isActive && <Text>Syncing... {percentage}%</Text>}

      {/* Mutations with state */}
      <Button
        title={isLoading ? '⏳ Sending...' : isQueued ? '📡 Queued' : liked ? '❤️ Liked' : '🤍 Like'}
        onPress={() => likePost({ postId: 42 })}
        disabled={isLoading}
      />

      <Button
        title="Send Message"
        onPress={() => sendMessage({ text: 'Hello!', userId: 1 })}
      />

      {/* Manual sync button */}
      <Button
        title={`Sync Now (${pendingCount})`}
        onPress={syncNow}
        disabled={pendingCount === 0}
      />
    </View>
  );
}
```
