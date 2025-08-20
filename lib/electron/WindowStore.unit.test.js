require('./WindowStore')
const DIController = require('../../shared/DIController')

class Window {
  #destroyed = false
  
  isDestroyed () {
    return this.#destroyed
  }

  close () {
    this.#destroyed = true
  }
}

test('close all windows', () => {
  const store = DIController.main.instantiate('WindowStore')

  const a = new Window()
  store.addWindow(a)

  const b = new Window()
  store.addWindow(b)

  /*
  Close a window manually before
  being closed by 'closeAllWindows'
  */
  const c = new Window()
  store.addWindow(c)
  expect(c.isDestroyed()).toBe(false)
  c.close()
  expect(c.isDestroyed()).toBe(true)

  expect(store.getWindowCount()).toBe(3)
  store.closeAllWindows()
  expect(a.isDestroyed()).toBe(true)
  expect(b.isDestroyed()).toBe(true)
  expect(c.isDestroyed()).toBe(true)
  expect(store.getWindowCount()).toBe(0)
})

test('add invalid window objects', () => {
  const store = DIController.main.instantiate('WindowStore')

  store.addWindow(undefined)
  store.addWindow('this is not a window')
  expect(store.getWindowCount()).toBe(2)

  store.closeAllWindows()
  expect(store.getWindowCount()).toBe(0)
})