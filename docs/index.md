---
layout: home

hero:
  name: React Native Offline Queue
  text: Offline-first sync for React Native
  tagline: Queue mutations when offline, sync seamlessly when connectivity returns. MMKV, AsyncStorage, or Realm — you choose.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/hooks
    - theme: alt
      text: GitHub
      link: https://github.com/nicepaytr/react-native-offline-queue

features:
  - icon: ⚡
    title: Smart Mutations
    details: Online? Direct API call. Offline? Queued automatically. Zero code changes needed.
  - icon: 🎯
    title: Optimistic Updates
    details: UI updates instantly — data syncs in the background. Users never wait.
  - icon: 🔄
    title: Flexible Sync Modes
    details: Auto (silent) or Manual (Alert, Toast, BottomSheet). Full control over the sync UX.
  - icon: 💾
    title: Pluggable Storage
    details: MMKV, AsyncStorage, Realm, or bring your own. Record-based adapters for large queues.
  - icon: 📊
    title: Live Sync Progress
    details: Track each item as it syncs — pending, syncing, success, failed. Build custom progress UIs.
  - icon: 🔋
    title: Background Compatible
    details: OfflineManager works outside React. Call flushQueue() from any background task runner.
---
