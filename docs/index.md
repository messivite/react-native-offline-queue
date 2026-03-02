---
layout: home

hero:
  name: React Native Offline Queue
  text: Offline-first sync for React Native
  tagline: Queue mutations when offline, sync seamlessly when back online. Per-action handlers, React Query support, and zero unnecessary re-renders.
  image:
    src: https://img.youtube.com/vi/G72jW65lIno/hqdefault.jpg
    alt: Example App Demo
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: Examples
      link: /examples/minimal
    - theme: alt
      text: API Reference
      link: /api/hooks
    - theme: alt
      text: View on GitHub
      link: https://github.com/messivite/react-native-offline-queue
      target: _blank

features:
  - icon: ⚡
    title: Per-Action Handlers
    details: Each mutation defines its own API call. No giant switch-case — logic stays next to the component that uses it.
  - icon: 🎯
    title: Optimistic Updates
    details: UI updates instantly with onOptimisticSuccess. Data syncs in the background when connectivity returns.
  - icon: 📊
    title: Mutation State Tracking
    details: "isLoading, isQueued, isSuccess, isError — built-in state for every mutation. No extra boilerplate."
  - icon: 🔄
    title: React Query Compatible
    details: Use mutateAsync from useMutation inside handlers. Your existing React Query setup just works.
  - icon: 💾
    title: Pluggable Storage
    details: MMKV, AsyncStorage, Realm, or bring your own. Record-based adapters for large queues.
  - icon: 🔋
    title: Zero Re-renders
    details: All hooks built on useSyncExternalStore. No Context cascading — only the component reading the value re-renders.
  - icon: 🎬
    title: Example App (Video)
    details: Watch the demo — offline mutations, optimistic UI, auto-sync when connectivity returns.
    link: https://www.youtube.com/shorts/G72jW65lIno
    linkText: Watch on YouTube
---
