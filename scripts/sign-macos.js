const { signAsync } = require('@electron/osx-sign')
const path = require('node:path')

function sign (path, label) {
  const opts = {
    app: path,
    binaries: [
      `${path}/Contents/Frameworks/libltc.11.dylib`
    ],
    optionsForFile: () => {
      return {
        hardenedRuntime: true
      }
    }
  }
  signAsync(opts)
    .then(() => {
      console.log(`✅ Signed ${label}`)
    })
    .catch(err => {
      console.error(`❌ Failed to sign ${label}`, err)
    })
}

sign(path.join(__dirname, '../bin/Bridge-darwin-arm64/Bridge.app'), 'Bridge-darwin-arm64')
sign(path.join(__dirname, '../bin/Bridge-darwin-x64/Bridge.app'), 'Bridge-darwin-x64')
