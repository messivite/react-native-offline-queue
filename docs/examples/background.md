# Background Sync Example

Sync queued operations when the app is in the background using `react-native-background-fetch`.

## Installation

```bash
npm install react-native-background-fetch
cd ios && pod install
```

## Setup

```tsx
// backgroundSync.ts
import BackgroundFetch from 'react-native-background-fetch';
import { OfflineManager } from 'react-native-offline-queue';

// Your API handler (same one used in OfflineProvider config)
async function syncHandler(action) {
  const response = await fetch(`https://api.example.com/${action.actionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export function initBackgroundSync() {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // minutes
      stopOnTerminate: false,
      startOnBoot: true,
    },
    async (taskId) => {
      console.log('[BackgroundSync] Task started:', taskId);

      // Re-configure (app may have been killed and relaunched)
      await OfflineManager.configure({
        storageType: 'mmkv',
        onSyncAction: syncHandler,
      });

      const queue = OfflineManager.getQueue();
      console.log('[BackgroundSync] Pending items:', queue.length);

      if (queue.length > 0) {
        await OfflineManager.flushQueue();
        console.log('[BackgroundSync] Sync complete');
      }

      BackgroundFetch.finish(taskId);
    },
    (taskId) => {
      // Timeout callback
      console.log('[BackgroundSync] Timeout:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );
}
```

## Register in App

```tsx
// App.tsx
import { useEffect } from 'react';
import { OfflineProvider } from 'react-native-offline-queue';
import { initBackgroundSync } from './backgroundSync';

export default function App() {
  useEffect(() => {
    initBackgroundSync();
  }, []);

  return (
    <OfflineProvider config={offlineConfig}>
      <YourApp />
    </OfflineProvider>
  );
}
```

::: tip
The `onSyncAction` handler should be the same function in both the foreground config and the background task. Extract it to a shared module to avoid duplication.
:::
