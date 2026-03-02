import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'React Native Offline Queue',
  description: 'Offline-first queue and sync manager for React Native',
  base: '/react-native-offline-queue/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/hooks' },
      { text: 'Examples', link: '/examples/basic' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@mustafaaksoy41/react-native-offline-queue' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'How It Works', link: '/guide/how-it-works' },
          ],
        },
        {
          text: 'Configuration',
          items: [
            { text: 'Storage Adapters', link: '/guide/storage-adapters' },
            { text: 'Sync Modes', link: '/guide/sync-modes' },
            { text: 'Online Restore UI', link: '/guide/online-restore' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Background Sync', link: '/guide/background-sync' },
            { text: 'Sync Progress', link: '/guide/sync-progress' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Hooks', link: '/api/hooks' },
            { text: 'OfflineManager', link: '/api/offline-manager' },
            { text: 'Types', link: '/api/types' },
            { text: 'Storage Adapters', link: '/api/storage-adapters' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'With Realm', link: '/examples/realm' },
            { text: 'Background Sync', link: '/examples/background' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/nicepaytr/react-native-offline-queue' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Mustafa Aksoy',
    },
    editLink: {
      pattern: 'https://github.com/nicepaytr/react-native-offline-queue/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
