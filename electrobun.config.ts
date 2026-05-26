// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import type { ElectrobunConfig } from 'electrobun/bun'

const pkg = require('./package.json') as { version: string }

const config: ElectrobunConfig = {
  app: {
    name: 'Bridge',
    identifier: 'se.svt.bridge',
    version: pkg.version,
    description: 'AI-powered playout control software by SVT',
    fileAssociations: [
      {
        ext: ['bridge'],
        name: 'Bridge workspace',
        role: 'Editor'
      }
    ]
  },
  build: {
    bun: {
      entrypoint: './lib/electrobun-runtime/index.ts'
    },
    /*
    Copy destinations are relative to the app folder Electrobun creates
    at `<bundle>/Contents/Resources/app/`. The bundled bun entrypoint
    lives at that folder's `bun/index.js`; placing our lib/ at the
    folder root makes `__dirname`-based path joins (e.g.
    `path.join(__dirname, '../assets.json')` in init-common.js)
    line up the way they do during plain `node index.js` development.
    */
    copy: {
      './public': 'public',
      './dist': 'dist',
      './plugins': 'plugins',
      './lib': 'lib',
      './app': 'app',
      './shared': 'shared',
      './api': 'api',
      './assets.json': 'assets.json',
      './package.json': 'package.json'
    },
    targets: 'current',
    asarUnpack: ['*.node', '*.dll', '*.dylib', '*.so'],
    mac: {
      codesign: false,
      notarize: false,
      createDmg: false,
      /*
      Electrobun expects either a `.iconset` folder (converted via
      iconutil) or a `.icon` file (Icon Composer). The repo only ships
      a flattened `.icns` with a single 512px image, so a proper
      multi-size iconset needs to be generated before re-enabling.
      */
      // icons: 'media/appicon.iconset',
      entitlements: {
        'com.apple.security.device.audio-input':
          'This app requires access to the microphone to enable LTC timecode input'
      }
    },
    win: {
      icon: 'media/appicon.ico'
    }
  },
  runtime: {
    exitOnLastWindowClosed: true
  }
}

export default config
