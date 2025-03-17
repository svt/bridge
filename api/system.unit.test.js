// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

require('./system')

const DIController = require('../shared/DIController')

let system
beforeAll(() => {
  system = DIController.main.instantiate('System', {
    Commands: {
      executeCommand: cmd => {
        switch (cmd) {
          case 'system.getVersion':
            return Promise.resolve('1.0.0')
        }
      }
    }
  })
})

test('get the system version', async () => {
  const version = await system.getVersion()
  expect(version).toEqual('1.0.0')
})
