import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const monorepoRoot = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@owlin/tracker-sdk': path.resolve(__dirname, 'owlin-sdk/src/index.js'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
    fs: {
      // Allow Vite to serve files from the monorepo root (hoisted node_modules)
      allow: [monorepoRoot],
      // Prevent Vite from serving/processing Playwright artifacts
      deny: ['playwright-report', 'test-results'],
    },
  },
  preview: {
    historyApiFallback: true,
  },
  optimizeDeps: {
    include: [
      'framer-motion',
      '@heroui/react',
      '@heroui/theme',
      'react',
      'react-dom',
      'react-router-dom',
      'cmdk',
    ],
    force: false, // Set to true if issues persist
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Performance optimizations — function-based splitting for granular chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Core React runtime — cached long-term, loaded on every page.
          // Anchor on the node_modules package boundary so this does NOT also
          // match scoped packages whose path contains "/react/" (notably
          // @heroui/react → .../node_modules/@heroui/react/...), which would
          // otherwise pull the entire HeroUI library into react-vendor.
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          // React Aria / Stately primitives that HeroUI builds on. Kept in
          // their own chunk so the HeroUI component layer and its a11y/state
          // foundation download in parallel and cache independently.
          if (id.includes('@react-aria') || id.includes('@react-stately') || id.includes('@react-types')) {
            return 'aria-vendor';
          }
          // HeroUI component framework
          if (id.includes('@heroui')) {
            return 'ui-vendor';
          }
          if (id.includes('framer-motion')) {
            return 'motion-vendor';
          }

          // Data fetching
          if (id.includes('@tanstack')) {
            return 'query-vendor';
          }

          // Charts (recharts + d3 transitive deps)
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'charts-vendor';
          }

          // Heavy utilities — split so they don't bloat the entry chunk
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          if (id.includes('socket.io') || id.includes('engine.io')) {
            return 'socket-vendor';
          }
          if (id.includes('peerjs')) {
            return 'peer-vendor';
          }
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  // Performance optimizations for dev server
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  // Vitest configuration — keep unit tests separate from Playwright E2E tests
  test: {
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['tests/**', 'node_modules/**'],
    // jsdom 29+ does not provision localStorage for some origins, and Node's
    // experimental localStorage global is undefined. Polyfill storage in a
    // shared setup file so safeStorage / pinnedPages / theme tests are stable.
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      // Include all .js source files that are exercised by the unit test suite.
      // .jsx component files in pages/ and components/ are covered by E2E tests
      // (Playwright) rather than unit tests, so they are intentionally excluded
      // to keep the coverage report meaningful.
      include: ['src/**/*.js'],
      exclude: ['node_modules/', 'tests/', '**/*.test.{js,jsx,ts,tsx}', '**/*.config.js'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
    },
  },
})
