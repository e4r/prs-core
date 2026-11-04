import { defineConfig } from 'tsup';

// "type": "module" in package.json → ESM is emitted as index.js, CJS as index.cjs,
// with matching index.d.ts / index.d.cts declarations.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
});
