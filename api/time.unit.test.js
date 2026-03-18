require('./time')

const DIController = require('../shared/DIController')

let time
beforeAll(() => {
  time = DIController.main.instantiate('Time', {
    Commands: {
      executeCommand: command => {
        if (command === 'time.getServerTime') {
          return Promise.resolve(Date.now())
        }
      },
      executeRawCommand: () => {}
    }
  })
})

test('get the server time', async () => {
  const value = await time.now()
  const now = Date.now()
  expect(value).toBeGreaterThanOrEqual(now - 100)
  expect(value).toBeLessThan(now + 100)
})
