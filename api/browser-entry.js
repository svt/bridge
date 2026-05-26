// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
ESM entrypoint used by scripts/bun-build.js for the renderer api
bundle. See shared/browser-entry.js for the rationale — in short,
Bun.build wraps CJS entries in uninvoked factories, so we import
the CJS module from an ESM wrapper to force its side effects
(DIController registration + `window.bridge = main`) to run at
bundle evaluation time.

api/index.js remains CJS so it can still be required from
lib/plugin/worker.js on the Node side.
*/

import '../api/index.js'
