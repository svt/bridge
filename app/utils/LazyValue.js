export class LazyValue {
  #isset
  #value
  #promises = []

  get () {
    if (!this.#isset) {
      return new Promise((resolve, reject) => {
        this.#promises.push({ resolve, reject })
      })
    }
    return Promise.resolve(this.#value)
  }

  #resolveAll () {
    for (const promise of this.#promises) {
      promise.resolve(this.#value)
    }
    this.#promises = []
  }

  set (value) {
    if (this.#isset) {
      throw new Error('Lazy value can only be set once')
    }
    this.#value = value
    this.#isset = true
    this.#resolveAll()
  }
}
