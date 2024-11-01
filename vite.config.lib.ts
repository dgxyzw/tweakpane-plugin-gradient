import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        globals: {
          tweakpane: 'Tweakpane',
        },
      },
      external: ['tweakpane', new RegExp('^@tweakpane')],
    },
  },
  plugins: [dts({
    rollupTypes: true,
    insertTypesEntry: true,
    outDir: 'dist',
  })],
});
