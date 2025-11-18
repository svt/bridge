const uuid = require('uuid')

const DIController = require('../../shared/DIController')

class WindowStore {
  #index = new Map()

  getWindowCount () {
    return this.#index.size
  }

  addWindow (id, window) {
    this.#index.set(id, window)
  }

  removeWindow (id) {
    this.#index.delete(id)
  }

  getWindow (id) {
    return this.#index.get(id)
  }

  getNewWindowId () {
    const proposal = uuid.v4()
    if (this.#index.has(proposal)) {
      return this.getNewWindowId()
    }
    return proposal
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
