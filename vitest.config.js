import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// Mirror the `@/*` -> project-root path alias from jsconfig.json so tests can
// import modules that use it. The string-alias matcher only rewrites imports
// where `@` is followed by `/`, so scoped packages (@supabase/*, @anthropic-ai/*)
// are left untouched.
const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/__tests__/**/*.test.js'],
    globals: false,
  },
})
