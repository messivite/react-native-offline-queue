# 5. Background Sync — Sync When App Is Backgrounded

Sync queued operations even when the app is **not in the foreground**. Uses `react-native-background-fetch` — the OS periodically wakes your app to run a short task.

## When to Use This

- User closes the app with pending items → next time OS allows a background fetch, queue is synced
- App is minimized for a long time → periodic sync attempts
- **Requires:** `react-native-background-fetch` (or similar: `expo-task-manager`, etc.)

## How It Works

1. `OfflineProvider` handles **foreground** sync (when user is online)
2. Background fetch task runs **separately** — OS decides when (e.g. every 15 min)
3. Inside the task: `OfflineManager.configure()` + `OfflineManager.flushQueue()`
4. Use the **same handler** in both foreground config and background task

## Installation

```bash
npm install react-native-background-fetch
cd ios && pod install
```

## Step 1: Extract Your Sync Handler

Use one handler for both foreground and background — avoid duplication:

```tsx
// api/syncHandler.ts
import type { OfflineAction } from '@mustafaaksoy41/react-native-offline-queue';

export async function syncHandler(action: OfflineAction) {
  const response = await fetch(`https://api.example.com/${action.actionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}
```

## Step 2: Configure Background Fetch

```tsx
// backgroundSync.ts
import BackgroundFetch from 'react-native-background-fetch';
import { OfflineManager } from '@mustafaaksoy41/react-native-offline-queue';
import { syncHandler } from './api/syncHandler';

export function initBackgroundSync() {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // minutes — OS may throttle
      stopOnTerminate: false,
      startOnBoot: true,
    },
    async (taskId) => {
      console.log('[BackgroundSync] Task started:', taskId);

      // Re-configure — app may have been killed and relaunched
      await OfflineManager.configure({
        storageType: 'mmkv',
        onSyncAction: syncHandler,
      });

      const queue = OfflineManager.getQueue();
      if (queue.length > 0) {
        await OfflineManager.flushQueue();
        console.log('[BackgroundSync] Synced', queue.length, 'items');
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

## Step 3: Initialize in App

```tsx
// App.tsx
import { useEffect } from 'react';
import { OfflineProvider } from '@mustafaaksoy41/react-native-offline-queue';
import { initBackgroundSync } from './backgroundSync';
import { syncHandler } from './api/syncHandler';

const offlineConfig = {
  storageType: 'mmkv',
  syncMode: 'auto',
  onSyncAction: syncHandler, // Same handler
};

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

## Important Notes

::: tip Shared Handler
The `onSyncAction` in `OfflineProvider` and the handler passed to `OfflineManager.configure()` in the background task should be the **same function**. Extract it to a shared module.
:::

::: warning OS Limits
- Background fetch is **best-effort** — the OS may delay or skip tasks
- `minimumFetchInterval` is a hint; actual frequency depends on usage patterns
- Test on real devices; simulators may behave differently
:::

## Summary

| Context | When | Who runs sync |
|---------|------|---------------|
| Foreground | User goes back online | `OfflineProvider` (via `handleOnlineRestore`) |
| Background | OS triggers fetch task | Your `BackgroundFetch.configure` callback |

This is the most advanced example — use it when you need sync to continue even when the app is closed.
