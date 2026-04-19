/**
 * @description
 * Build script for macOS Electron packages
 * Run as `node scripts/electron-build-mac.js <arm64|x64>`
 */

const packager = require('@electron/packager')
const assert = require('node:assert')
const path = require('node:path')

const [,, ARCH] = process.argv
assert(ARCH, 'Missing required argument \'arch\'')

const ROOT_DIR = path.join(__dirname, '../')

packager({
  dir: ROOT_DIR,
  name: 'Bridge',
  platform: 'darwin',
  arch: ARCH,
  extendInfo: path.join(ROOT_DIR, 'extra.plist'),
  icon: path.join(ROOT_DIR, 'media/appicon.icns'),
  overwrite: true,
  asar: {
    unpack: '**/*.{node,dylib}',
    unpackDir: '**/libltc-wrapper'
  },
  ignore: [
    /webpack.*\.js/,
    /^\/docs\//,
    /^\/README\.md$/,
    /^\/Dockerfile$/,
    /^\/docker-compose\.yml$/
  ],
  out: path.join(ROOT_DIR, 'bin')
})
  .then(appPaths => {
    console.log('%s\x1b[32m%s\x1b[0m', 'Built app bundle: ', appPaths.join(', '))
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
