// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
ESM entrypoint used by scripts/bun-build.js for the renderer bundle.

shared/index.js is CJS (uses `require()`, no exports) and Bun.build
wraps every CJS module in a lazy factory inside the IIFE output. When
a CJS file is the entry, that factory is never invoked, so the file's
top-level side effects — including `window.shared = { ... }` — never
run and downstream code crashes on `window.shared.merge.deep(...)`.

Importing the file from an ESM wrapper forces Bun.build to invoke the
CJS factory at bundle evaluation time, which runs the side effects.
*/

import '../shared/index.js'
