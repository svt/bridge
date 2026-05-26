// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Bundle the renderer-side code with Bun.build, replacing the previous
webpack pipeline. Outputs go to ./dist and a manifest is written to
./assets.json so lib/server.js can render the SPA shell with the
correct hashed asset URLs.

Run as:
  bun scripts/bun-build.js           # production build (hashed names, minified)
  bun scripts/bun-build.js --dev     # development build (sourcemaps, no minify)
*/

const path = require('node:path')
const fs = require('node:fs')
const crypto = require('node:crypto')

const isDev = process.argv.includes('--dev')
const isProd = !isDev

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DIST = path.join(PROJECT_ROOT, 'dist')

const hash = crypto
  .createHash('md5')
  .update(`${Date.now()}${Math.random() * 1e10}`)
  .digest('hex')

/*
Asset loaders that match the webpack rules we replaced:
  .svg  → inline as string (asset/source)
  .png/.jpg/.jpeg/.gif/.woff/.woff2/.ttf → emitted as file (asset/resource)
*/
const LOADERS = {
  '.svg': 'text',
  '.png': 'file',
  '.jpg': 'file',
  '.jpeg': 'file',
  '.gif': 'file',
  '.woff': 'file',
  '.woff2': 'file',
  '.ttf': 'file',
  '.glsl': 'text'
}

const DEFINE = {
  'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
}

/*
api/node/transport.js requires 'worker_threads' for its Node-side
runtime path. When bundled for the browser the require is unreachable
(the api/ entry exposes both browser and node paths and the renderer
only ever exercises the browser one), but the bundler still needs to
resolve it. Webpack used `resolve.alias = { worker_threads: false }`;
the equivalent for Bun.build is a plugin that returns an empty module
for the import specifier.
*/
const stubBuiltinsPlugin = {
  name: 'stub-node-builtins',
  setup (build) {
    build.onResolve({ filter: /^worker_threads$/ }, () => {
      return { path: 'worker_threads', namespace: 'stub-builtin' }
    })
    build.onLoad({ filter: /.*/, namespace: 'stub-builtin' }, () => {
      return { contents: 'module.exports = {}', loader: 'js' }
    })
  }
}

function logStart (label) {
  process.stdout.write(`[bun-build] ${label} … `)
}
function logDone (start) {
  console.log(`${Math.round(performance.now() - start)}ms`)
}

/**
 * Run Bun.build for one entry with a fixed entry filename pattern.
 *
 * @param { string } name  Logical entry name (used in the output filename)
 * @param { string } entrypoint  Path resolved from project root
 * @param { string[] } external
 */
async function buildEntry (name, entrypoint, { external = [], hashed = true } = {}) {
  const t0 = performance.now()
  logStart(name)

  /*
  The standalone bridge.css bundle is referenced from plugin-generated
  HTML via the hardcoded URL `/bridge.bundle.css` (api/server.js's
  STYLE_RESET). Skip the cache-busting hash for that entry so the URL
  resolves to a real file. All other entries embed the hash so the SPA
  shell can update without stale-cache problems.
  */
  const prefix = hashed ? `${hash}.` : ''

  const result = await Bun.build({
    entrypoints: [path.join(PROJECT_ROOT, entrypoint)],
    outdir: DIST,
    target: 'browser',
    format: 'iife',
    naming: {
      entry: `${prefix}${name}.bundle.[ext]`,
      asset: `${prefix}[name].[ext]`,
      chunk: `${prefix}[name]-[hash].[ext]`
    },
    sourcemap: isDev ? 'inline' : 'external',
    minify: isProd,
    loader: LOADERS,
    external,
    define: DEFINE,
    publicPath: '/',
    plugins: [stubBuiltinsPlugin]
  })

  if (!result.success) {
    console.error()
    for (const log of result.logs) console.error(log)
    throw new Error(`Bun.build failed for ${name}`)
  }
  logDone(t0)
  return result
}

async function main () {
  console.log(`[bun-build] ${isProd ? 'production' : 'development'} build — hash ${hash.slice(0, 8)}`)

  await fs.promises.rm(DIST, { recursive: true, force: true })
  await fs.promises.mkdir(DIST, { recursive: true })

  /*
  Main entries — order matches the load order expected by app/template.js.

  `shared/` and `api/` are CJS entries; Bun.build wraps CJS modules in
  uninvoked factories inside the IIFE bundle, which means top-level
  side effects (`window.shared = …`, `window.bridge = …`) never run.
  The `browser-entry.js` ESM wrappers force the CJS factory to execute
  at bundle evaluation time. See those files for context.
  */
  await buildEntry('shared', './shared/browser-entry.js')
  await buildEntry('app', './app/index.jsx')
  await buildEntry('api', './api/browser-entry.js')

  /*
  Standalone CSS bundle for embedded widget hosts.
  Emitted without a hash so the hardcoded `/bridge.bundle.css` URL in
  api/server.js (STYLE_RESET) resolves.
  */
  await buildEntry('bridge', './app/bridge.css', { hashed: false })

  /* Plugin widgets. Each plugin's `app/` is its renderer entry. */
  const pluginsDir = path.join(PROJECT_ROOT, 'plugins')
  const pluginDirs = fs.readdirSync(pluginsDir)
    .filter(name => fs.statSync(path.join(pluginsDir, name)).isDirectory())
    .filter(name => fs.existsSync(path.join(pluginsDir, name, 'app')))

  for (const dir of pluginDirs) {
    const manifest = require(path.join(pluginsDir, dir, 'package.json'))
    const entry = `./plugins/${dir}/app/index.jsx`
    if (!fs.existsSync(path.join(PROJECT_ROOT, entry))) continue
    await buildEntry(manifest.name, entry, { external: ['bridge'] })
  }

  /*
  Write assets.json. The renderer template (app/template.js) reads
  `assets.assets` and renders <script>/<link> tags in this order, so
  shared globals load before app code that depends on them.
  */
  const assets = [
    `${hash}.shared.bundle.js`,
    `${hash}.app.bundle.css`,
    `${hash}.app.bundle.js`,
    `${hash}.api.bundle.js`
  ]
  await Bun.write(
    path.join(PROJECT_ROOT, 'assets.json'),
    JSON.stringify({ hash, assets })
  )

  console.log('[bun-build] done')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
