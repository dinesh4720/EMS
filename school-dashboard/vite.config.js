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
    dedupe: ['three'],
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
    // Performance optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@heroui/react', '@heroui/theme'],
          'charts-vendor': ['recharts'],
          '3d-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  // Performance optimizations for dev server
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
})
