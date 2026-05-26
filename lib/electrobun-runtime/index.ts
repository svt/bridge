// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Entry point Electrobun's CLI bundles and runs inside Bun.

Renamed to index.ts because Electrobun's launcher hard-codes the bundled
bun entry path to `<appFolder>/bun/index.js`. Bun.build derives the
output filename from the entrypoint basename, so naming the source
`index.ts` keeps the launcher's path resolution happy.

This file must be ESM/TS because `electrobun/bun` is an ESM module with
top-level `await` (it preloads BuildConfig), which Bun cannot import via
synchronous CJS `require()`. We load it once here, stash the namespace
on globalThis, and the rest of the codebase (all CJS) reads from
`globalThis.__ELECTROBUN__` to avoid the async-module barrier.

We anchor `createRequire` at the copied `lib/` directory inside the
bundled app folder using `import.meta.dir` (which points at
`<appFolder>/bun/` at runtime). This means the copy mapping in
`electrobun.config.ts` must place our `lib/` at `<appFolder>/lib/`.
*/

import ElectrobunDefault, * as ElectrobunNS from 'electrobun/bun'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

/*
The Electrobun module exposes a mix of named exports (BrowserWindow,
Utils, ApplicationMenu, app, PATHS, …) and a default export object
that additionally exposes `events`. We merge both so CJS callers can
reach everything through `globalThis.__ELECTROBUN__`.
*/
const ElectrobunAPI: any = {
  ...(ElectrobunNS as any),
  events: (ElectrobunDefault as any).events
}

;(globalThis as any).__ELECTROBUN__ = ElectrobunAPI
;(globalThis as any).__BRIDGE_ELECTROBUN__ = true
process.env.BRIDGE_DESKTOP = '1'

/*
import.meta.dir resolves to `<appFolder>/bun/` at runtime; `../lib`
points at the copied lib folder under the same appFolder.
*/
const libDir = join((import.meta as any).dir, '..', 'lib')
const require = createRequire(pathToFileURL(join(libDir, 'index.js')).href)

require('./init-common')
require('./server')
require('./init-electrobun')
