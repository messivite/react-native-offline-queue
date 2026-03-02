# Changelog

All notable changes to this project will be documented in this file.

## [0.1.9] - 2025-03-02

### Added
- Example App video — thumbnail + link in README, docs homepage, nav, and sidebar
- Examples section overhaul — Minimal → Basic → React Query → Realm → Background (simple to advanced)

### Changed
- Docs header version now reads from `package.json` (auto-sync)
- External links open in new tab (README, docs nav, sidebar, edit links)
- Examples sidebar: "Example App (Video)" as first item

### Fixed
- License copyright year (2024-2025)

## [0.1.8] - 2025-03-02

### Added
- Minimal example — 5-minute getting started
- GitHub Pages deploy workflow for documentation
- `@rollup/rollup-linux-x64-gnu` optional dependency for docs build on CI

### Changed
- package.json `homepage` and `documentation` point to docs URL
- Examples ordered from simple to advanced with step-by-step explanations

## [0.1.7] - 2025-03-02

### Changed
- README and documentation updates

## [0.1.6] - 2025-03-02

### Added
- GitHub Actions workflow for deploying docs to GitHub Pages
- Docs link and badge in README

### Fixed
- VitePress build on Linux CI (rollup optional deps)

## [0.1.5] - 2025-03-02

### Added
- VitePress documentation site
- Getting Started, API Reference, Examples, Changelog pages

### Fixed
- `npm ci` on CI — `search-insights` added to package-lock.json
- package-lock.json synced with package.json

## [0.1.4] - 2025-03-02

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

## [0.1.0] - 2025-02-28

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
