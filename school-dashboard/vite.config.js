import { defineConfig } from 'vite'
import { createRequire } from 'module'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const require = createRequire(import.meta.url)

// Stub @owlin/tracker-sdk when not installed (e.g. Vercel builds)
function owlinOptionalPlugin() {
  const moduleId = '@owlin/tracker-sdk'
  const resolvedId = '\0owlin-stub'
  return {
    name: 'owlin-optional',
    resolveId(id) {
      if (id === moduleId) {
        try {
          require.resolve(moduleId)
        } catch {
          return resolvedId
        }
      }
    },
    load(id) {
      if (id === resolvedId) {
        return 'export function init() { return null; }\nexport function destroy() {}'
      }
    },
  }
}

export default defineConfig({
  plugins: [owlinOptionalPlugin(), react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  server: {},
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

          // Core React runtime — cached long-term, loaded on every page
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          // UI framework
          if (id.includes('@heroui') || id.includes('@react-aria') || id.includes('@react-stately') || id.includes('@react-types')) {
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

          // 3D (only loaded by pages that use it)
          if (id.includes('three') || id.includes('@react-three')) {
            return '3d-vendor';
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
  },
})
