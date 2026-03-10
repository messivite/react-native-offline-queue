# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.11] - 2026-03-10

### Changed
- **MMKV adapter (v4 API)** — Switched from `new MMKV()` to `createMMKV()` for react-native-mmkv v4 compatibility. The v3 API (`MMKV` class) was removed in v4. Requires `react-native-mmkv@^4`.

## [0.1.5] - 2026-03-05

### Fixed
- **Network log** — Log now only fires when connection status actually changes (online↔offline), avoiding duplicate logs when NetInfo fires multiple times for the same state

## [0.1.4] - 2026-03-02

### Added
- **Per-action handler registry** — each `useOfflineMutation` can define its own `handler` instead of relying on a centralized `onSyncAction`
- **Mutation state tracking** — `status`, `isLoading`, `isQueued`, `isSuccess`, `isError`, `error`, `reset()` returned from `useOfflineMutation`
- **`onSuccess` callback** — fires only after a successful direct API call (online), separate from `onOptimisticSuccess`
- **React Query integration** — `handler` works with `mutateAsync` from `useMutation`
- **Network status via `useSyncExternalStore`** — `useNetworkStatus` no longer uses React Context, zero cascading re-renders
- Technology badges and MIT license to README

### Changed
- **`OfflineProvider`** no longer wraps children in a Context Provider — uses singleton store pattern instead
- **`useNetworkStatus`** migrated from `useContext` to `useSyncExternalStore` for better performance
- Improved README with full examples, React Query patterns, and state flow tables

### Fixed
- Handler persistence — per-action handlers no longer unregister on component unmount, preventing sync failures after navigation

## [0.1.0] - 2026-02-28

### Added
- Initial release
- `OfflineProvider` component with NetInfo integration
- `useOfflineMutation` hook for queue-aware mutations
- `useOfflineQueue` hook with `useSyncExternalStore`
- `useSyncProgress` hook for live sync tracking
- `useNetworkStatus` hook for connectivity status
- `OfflineManager` singleton for direct API access
- Storage adapters: MMKV, AsyncStorage, Memory
- Realm adapter (record-based storage)
- Custom storage adapter interface
- Auto and manual sync modes
- `onOnlineRestore` callback for manual mode UI
- Background sync support via `OfflineManager.flushQueue()`
