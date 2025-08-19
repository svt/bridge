const uuid = require('uuid')
const DIController = require('../../shared/DIController')

class WindowStore {
  #index = new Map()

  #getUID () {
    const proposal = uuid.v4()
    if (this.#index.has(proposal)) {
      return this.#getUID()
    }
    return proposal
  }

  setMainWindow (window) {
    this.#index.set('main', window)
  }

  addChildWindow (window) {
    const id = this.#getUID()
    this.#index.set(id, window)
  }

  closeAllWindows () {
    this.#index.forEach(window => {
      window.close()
    })
    this.#index.clear()
  }
}

DIController.main.register('WindowStore', WindowStore)
