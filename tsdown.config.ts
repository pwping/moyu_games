import { defineConfig } from 'tsdown'

/**
 * Standalone tsdown config for the moyu-games DSH plugin.
 *
 * Node half: a cordis plugin bundle (lib/index.js) that externalizes the DSH
 * host SDK (+ cordis + schemastery), which the dsh host process resolves at
 * mount time.
 *
 * Browser half: the DSH client bundle (lib/client.js) — a CommonJS module
 * wrapped as a closure-factory handed to `window.__ModuleLoader__.load`, with
 * the shell's frozen module table kept external (react, cordis, ui-slots, ...)
 * and everything else inlined. This is the exact contract dsh's web shell
 * expects for a plugin client bundle; it is what makes the plugin installable
 * by anyone, independent of any plugin family or monorepo.
 */

/** Plugin identity stamped into the client bundle handoff. */
const PLUGIN_ID = 'moyu-games'

/**
 * The shell's frozen client module table (dsh-web-frontend staticModules):
 * these specifiers are external and resolved through the loader's injected
 * `require`; anything not listed is inlined into the bundle.
 */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
]

export default defineConfig([
  {
    name: PLUGIN_ID,
    entry: ['src/index.ts', 'src/invariant.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    dts: false,
    clean: false,
    // Keep the `.js` extension (not `.mjs`) so `main`/`exports` (".") and the
    // dsh loader resolve exactly `lib/index.js`.
    fixedExtension: false,
    // The dsh host process supplies these at mount time; never bundle them.
    external: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-settings',
      '@deepseek-ai/dsh-system-prompt',
      '@deepseek-ai/dsh-host-webserver',
      '@deepseek-ai/dsh-session',
      'schemastery',
    ],
  },
  {
    name: `${PLUGIN_ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    noExternal: (id: string) => CLIENT_EXTERNALS.includes(id) ? undefined : true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
