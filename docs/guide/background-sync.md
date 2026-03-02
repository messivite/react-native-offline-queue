# Background Sync

This package doesn't manage background tasks — that's platform-specific. But `OfflineManager` is a standalone singleton that works outside React, so you can call it from any background task runner.

## react-native-background-fetch

```tsx
import BackgroundFetch from 'react-native-background-fetch';
import { OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';

BackgroundFetch.configure({
  minimumFetchInterval: 15,
}, async (taskId) => {
  // Re-configure if the app was killed and relaunched
  await OfflineManager.configure({
    storageType: 'mmkv',
    onSyncAction: myApiHandler,
  });

  await OfflineManager.flushQueue();
  BackgroundFetch.finish(taskId);
});
```

## expo-task-manager

```tsx
import * as TaskManager from 'expo-task-manager';
import { OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';

TaskManager.defineTask('OFFLINE_SYNC', async () => {
  await OfflineManager.configure({
    storageType: 'mmkv',
    onSyncAction: myApiHandler,
  });
  
  await OfflineManager.flushQueue();
  return BackgroundFetch.Result.NewData;
});
```

::: warning Important
If iOS killed and relaunched the app for a background task, `OfflineManager.configure()` must be called again before `flushQueue()`. The in-memory configuration is lost on app termination.
:::

## Why configure() again?

When iOS terminates and relaunches the app for a background task:
1. The React component tree is NOT mounted
2. `OfflineProvider` never renders
3. `OfflineManager` has no configuration

So you need to manually call `configure()` to set up the storage adapter and sync handler before flushing.
