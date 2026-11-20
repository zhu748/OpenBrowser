import { copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import vue from '@vitejs/plugin-vue';
import { build } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { values } = parseArgs({ options: { 'out-dir': { type: 'string' } } });
const outDir = values['out-dir'] ? path.resolve(values['out-dir']) : path.join(root, 'dist');

await build({
  root,
  base: './',
  configFile: false,
  publicDir: false,
  plugins: [vue({ features: { optionsAPI: false } })],
  define: {
    // Compile the npm runtime for the Electron renderer's browser globals.
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir,
    emptyOutDir: !values['out-dir'],
    minify: 'esbuild',
    modulePreload: false,
    rollupOptions: {
      // The hybrid workbench imports these entry points using their public exports.
      preserveEntrySignatures: 'strict',
      input: {
        workbench: path.join(root, 'index.html'),
        templates: path.join(root, 'src/templates/mount.ts'),
        kernels: path.join(root, 'src/kernels/mount.ts'),
        management: path.join(root, 'src/management/mount.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
});

const vueRoot = path.dirname(require.resolve('vue/package.json'));
await copyFile(path.join(vueRoot, 'LICENSE'), path.join(outDir, 'VUE-LICENSE.txt'));
