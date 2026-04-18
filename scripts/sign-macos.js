/**
 * @description
 * Sign and notarize macOS app bundles
 * Run as `node scripts/sign-macos.js`
 *
 * Requires environment variables:
 * - APPLE_ID
 * - APPLE_ID_PASSWORD
 * - APPLE_TEAM_ID
 */

const { signAsync } = require('@electron/osx-sign')
const { notarize } = require('@electron/notarize')
const path = require('node:path')
const assert = require('node:assert')

const { APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID } = process.env
assert(APPLE_ID, 'Missing environment variable \'APPLE_ID\'')
assert(APPLE_ID_PASSWORD, 'Missing environment variable \'APPLE_ID_PASSWORD\'')
assert(APPLE_TEAM_ID, 'Missing environment variable \'APPLE_TEAM_ID\'')

async function signAndNotarize (appPath, label) {
  console.log(`Signing ${label}...`)
  await signAsync({
    app: appPath,
    optionsForFile: () => ({
      hardenedRuntime: true
    })
  })
  console.log(`✅ Signed ${label}`)

  console.log(`Notarizing ${label}...`)
  await notarize({
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_ID_PASSWORD,
    teamId: APPLE_TEAM_ID
  })
  console.log(`✅ Notarized ${label}`)
}

const APP_BUNDLES = [
  { path: path.join(__dirname, '../bin/Bridge-darwin-arm64/Bridge.app'), label: 'Bridge-darwin-arm64' },
  { path: path.join(__dirname, '../bin/Bridge-darwin-x64/Bridge.app'), label: 'Bridge-darwin-x64' }
]

;(async () => {
  for (const bundle of APP_BUNDLES) {
    await signAndNotarize(bundle.path, bundle.label)
  }
})()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
