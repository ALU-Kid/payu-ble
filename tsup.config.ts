import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    outDir: 'dist',
    sourcemap: true,
    splitting: false,
    treeshake: true,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.mjs'
      }
    },
  },
  // Platform modules
  {
    entry: ['platform/platform_index.ts', 'platform/platform_*.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: false, // Don't clean since main lib already cleaned
    outDir: 'platform/dist',
    sourcemap: true,
    splitting: false,
    treeshake: true,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.mjs'
      }
    }
  }
])