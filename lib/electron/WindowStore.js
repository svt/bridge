const DIController = require('../../shared/DIController')

class WindowStore {
  #index = new Set()

  getWindowCount () {
    return this.#index.size
  }

  addWindow (window) {
    this.#index.add(window)
  }

  closeAllWindows () {
    this.#index.forEach(window => {
      if (typeof window?.isDestroyed !== 'function' || typeof window?.close !== 'function') {
        return
      }

      if (window?.isDestroyed()) {
        return
      }

      window?.close()
    })
    this.#index.clear()
  }
}

DIController.main.register('WindowStore', WindowStore)
