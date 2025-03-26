import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    include: [resolve(__dirname, 'packages/testing-kit-ng/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}')],
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'packages/!(testing-kit-ng)/**'  // Exclude all packages except testing-kit-ng
    ]
  }
})
