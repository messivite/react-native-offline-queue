# Changelog

All notable changes to this project will be documented in this file.

## [0.1.4] - 2026-03-02

### Added
- Per-action handler registry — define API calls per mutation instead of a central switch-case
- Mutation state tracking — `status`, `isLoading`, `isQueued`, `isSuccess`, `isError`, `error`, `reset()`
- `onSuccess` callback — fires only after a successful direct API call (online)
- React Query integration — use `mutateAsync` from `useMutation` inside handlers
- Network status via `useSyncExternalStore` — zero cascading re-renders
- 38 unit tests with Jest
- GitHub Actions CI (Node 18 + 20)
- Technology badges, MIT license, and CHANGELOG

### Changed
- `OfflineProvider` no longer uses React Context — reads from singleton store
- `useNetworkStatus` migrated from `useContext` to `useSyncExternalStore`
- Improved docs with React Query examples and state flow tables

### Fixed
- Handler persistence — per-action handlers survive component unmount

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
- Realm adapter (record-based)
- Custom storage adapter interface
- Auto and manual sync modes
- `onOnlineRestore` callback with Alert, Toast, BottomSheet examples
- Background sync support
