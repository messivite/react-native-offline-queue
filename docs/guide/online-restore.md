# Online Restore UI

When `syncMode` is `'manual'`, you control what UI appears when the device goes back online.

## Option A: Alert

```tsx
onOnlineRestore: ({ pendingCount, syncNow, discardQueue }) => {
  Alert.alert(
    'Back Online',
    `${pendingCount} pending operations. Sync now?`,
    [
      { text: 'Later', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discardQueue },
      { text: 'Sync', onPress: syncNow },
    ]
  );
},
```

## Option B: Toast

```tsx
import Toast from 'react-native-toast-message';

onOnlineRestore: ({ pendingCount, syncNow }) => {
  Toast.show({
    type: 'info',
    text1: 'Back online',
    text2: `Tap to sync ${pendingCount} pending operations`,
    onPress: () => {
      syncNow();
      Toast.hide();
    },
  });
},
```

## Option C: Bottom Sheet

```tsx
import { bottomSheetRef } from './BottomSheetController';

onOnlineRestore: ({ pendingCount, syncNow, discardQueue }) => {
  bottomSheetRef.current?.present({ pendingCount, syncNow, discardQueue });
},
```

Inside your bottom sheet, use `useSyncProgress` for live tracking:

```tsx
function SyncSheet() {
  const { items, percentage, isActive } = useSyncProgress();

  return (
    <View>
      <ProgressBar progress={percentage / 100} />
      {items.map((item) => (
        <Text key={item.action.id}>
          {item.status === 'success' ? '✅' : item.status === 'failed' ? '❌' : '⏳'}
          {' '}{item.action.actionName}
        </Text>
      ))}
    </View>
  );
}
```

## Option D: Silent

Omit `onOnlineRestore` entirely. Nothing happens automatically — you trigger sync manually through `useOfflineQueue`:

```tsx
const { syncNow, pendingCount } = useOfflineQueue();

// Render your own sync button
<Button title={`Sync (${pendingCount})`} onPress={syncNow} />
```
