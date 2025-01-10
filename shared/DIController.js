const DIControllerError = require('./DIControllerError')

class DIController {
  static main = new DIController()

  #index = new Map()

  register (name, object, requirements = []) {
    if (this.#index.has(name)) {
      throw new DIControllerError('Entry has already been registered')
    }
    this.#index.set(name, {
      object,
      requirements
    })
  }

  instantiate (name, scope = {}) {
    const requirements = this.#getRequirements(name)
    const props = {}

    for (const requirement of requirements) {
      if (!scope[requirement]) {
        scope[requirement] = this.instantiate(requirement, scope)
      }
      props[requirement] = scope[requirement]
    }

    return new (this.#getObject(name))(props)
  }

  #getEntry (name) {
    const entry = this.#index.get(name)
    if (!entry) {
      throw new DIControllerError('No registered entry was found with the provided name')
    }
    return entry
  }

  #getObject (name) {
    const entry = this.#getEntry(name)
    if (!entry?.object) {
      throw new DIControllerError('Missing object for entry')
    }
    return entry.object
  }

  #getRequirements (name) {
    const entry = this.#getEntry(name)
    return entry?.requirements || []
  }
}

module.exports = DIController
