import { defineConfig } from 'vitepress'
import { readFileSync } from 'fs'
import { join } from 'path'

const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))

export default defineConfig({
  title: 'React Native Offline Queue',
  description: 'Offline-first queue and sync manager for React Native. Works great with React Query.',
  base: '/react-native-offline-queue/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'React Native Offline Queue' }],
    ['meta', { property: 'og:description', content: 'Offline-first queue and sync manager for React Native' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/hooks' },
      { text: 'Examples', link: '/examples/minimal' },
      { text: 'Example App (Video)', link: 'https://www.youtube.com/shorts/G72jW65lIno', target: '_blank', rel: 'noopener noreferrer' },
      {
        text: `v${pkg.version}`,
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@mustafaaksoy41/react-native-offline-queue', target: '_blank', rel: 'noopener noreferrer' },
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
          text: 'Core Concepts',
          items: [
            { text: 'Sync Strategies', link: '/guide/sync-strategies' },
            { text: 'Storage Adapters', link: '/guide/storage-adapters' },
            { text: 'Sync Modes', link: '/guide/sync-modes' },
            { text: 'Online Restore UI', link: '/guide/online-restore' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'React Query Integration', link: '/guide/react-query' },
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
          text: 'Examples (Simple → Advanced)',
          items: [
            { text: 'Example App (Video)', link: 'https://www.youtube.com/shorts/G72jW65lIno', target: '_blank', rel: 'noopener noreferrer' },
            { text: '1. Minimal — 5 Minutes', link: '/examples/minimal' },
            { text: '2. Basic — Full Featured', link: '/examples/basic' },
            { text: '3. React Query', link: '/examples/react-query' },
            { text: '4. Realm Storage', link: '/examples/realm' },
            { text: '5. Background Sync', link: '/examples/background' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/messivite/react-native-offline-queue', target: '_blank', rel: 'noopener noreferrer' },
      { icon: 'npm', link: 'https://www.npmjs.com/~mustafaaksoy41', target: '_blank', rel: 'noopener noreferrer' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/mustafa-aksoy-87532a385/', target: '_blank', rel: 'noopener noreferrer' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Made with ❤️ by <a href="https://www.npmjs.com/~mustafaaksoy41" target="_blank">Mustafa Aksoy</a> · <a href="https://github.com/messivite" target="_blank">GitHub</a> · <a href="https://www.linkedin.com/in/mustafa-aksoy-87532a385/" target="_blank">LinkedIn</a>',
    },
    editLink: {
      pattern: 'https://github.com/messivite/react-native-offline-queue/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  },
})
