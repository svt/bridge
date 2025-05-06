const RequestManager = require('./RequestManager')

function fetchShim (url, opts, fail) {
  return new Promise((resolve, reject) => (
    setTimeout(() => {
      if (opts.signal && opts.signal.aborted) {
        return reject('ABORTED')
      }
      if (fail) {
        return reject()
      }
      return resolve()
    }, 50)
  ))
}

beforeAll(() => {
  manager = new RequestManager({ fetchFunction: fetchShim })
})

test('make a successful request', () => {
  const promise = manager.makeRequestForItemWithId('id_1', '', {}, false)
  expect(promise).resolves.toBe(undefined)
})

test('make a failing request', () => {
  const promise = manager.makeRequestForItemWithId('id_2', '', {}, true)
  expect(promise).rejects.toBe(undefined)
})

test('abort a request', () => {
  const promise = manager.makeRequestForItemWithId('id_3', '', {}, false)
  manager.abortAllRequestsForItemId('id_3')
  expect(promise).rejects.toBe('ABORTED')
})

test('controller is cleaned up after request suceeds', async () => {
  const promise = manager.makeRequestForItemWithId('id_4', '', {}, false)
  expect(manager.countControllersForItem('id_4')).toBe(1)
  await promise
  expect(manager.countControllersForItem('id_4')).toBe(0)
})

test('controller is cleaned up after request fails', async () => {
  const promise = manager.makeRequestForItemWithId('id_5', '', {}, true)
  expect(manager.countControllersForItem('id_5')).toBe(1)
  try {
    await promise
  } catch(_) {}
  expect(manager.countControllersForItem('id_5')).toBe(0)
})