/**
 * @description
 * Post build actions for macOS-builds
 * Run as `node electron-postbuild-macos.js <path to app bundle>`
 *
 * Actions:
 * - Copy dynamically linked libraries into the app bundle
 */

const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

const [,, APP_BUNDLE] = process.argv
assert(APP_BUNDLE, 'Missing required argument \'app bundle\'')

const CURRENT_DIR = process.cwd()

const LIBRARIES_TO_COPY = [
  {
    path: '../plugins/timecode/node_modules/libltc-wrapper/build/Release',
    fileName: 'libltc.11.dylib'
  }
]

const FRAMEWORKS_DIR = path.join(CURRENT_DIR, APP_BUNDLE, '/Contents/Frameworks')

/*
Copy libraries into the FRAMEWORKS_DIR
within the app bundle
*/
console.log('Performing post build tasks')
for (const library of LIBRARIES_TO_COPY) {
  const from = path.join(__dirname, library.path, library.fileName)
  const to = path.join(FRAMEWORKS_DIR, library.fileName)
  fs.copyFileSync(from, to)
  console.log('%s\x1b[32m%s\x1b[0m', 'Copied framwork: ', library.fileName)
}
