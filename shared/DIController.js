const DIControllerError = require('./DIControllerError')

/**
 * @description
 * A light dependency injection controller
 * allowing classes to be registered and
 * managing the creation of their dependencies
 *
 * @typedef {{
 *  object: any
 *  requirements: String[]
 * }} DIControllerObjectEntry
 *
 */
class DIController {
  /**
   * The main singleton
   * instance of this class
   * @type { DIController }
   */
  static main = new DIController()

  /**
   * A map to keep track
   * of registered classes
   *
   * This is used for lookup
   *
   * @type { Map.<String, DIControllerObjectEntry> }
   */
  #index = new Map()

  /**
   * Register a new class to be
   * handled by this controller
   * @param { String } name The name of the object to register
   * @param { any } object A class
   * @param { String[] } requirements A string of required classes that will be passed
   *                         to the class constructor upon creation
   */
  register (name, object, requirements = []) {
    if (this.#index.has(name)) {
      throw new DIControllerError('Entry has already been registered')
    }
    this.#index.set(name, {
      object,
      requirements
    })
  }

  /**
   * Instantiate a class by its name
   * and all of its requriements recursively
   *
   * @param { String } name
   * @param { any } scope An object for overriding dependencies
   *                      from the controller's index
   * @param  { ...any } args Additional transparent arguments that
   *                         will be passed to the constructor
   * @returns { any }
   *
   * @example
   * // Instantiate without scope, will create all requirements recursively
   * const myInstance = controller.instantiate('MyClass')
   *
   * @example
   * // Instantiate with scope, will use the requirement from the scope object
   * const myInstance = controller.instantiate('MyClass', { MyClassRequirement: new MyClassRequirementSkim() })
   */
  instantiate (name, scope = {}, ...args) {
    const requirements = this.#getRequirements(name)
    const props = {}

    for (const requirement of requirements) {
      if (!scope[requirement]) {
        scope[requirement] = this.instantiate(requirement, scope)
      }
      props[requirement] = scope[requirement]
    }

    return new (this.#getObject(name))(props, ...(args || []))
  }

  /**
   * Get an object
   * entry by its name
   * @param { String } name
   * @returns { DIControllerObjectEntry | undefined }
   */
  #getEntry (name) {
    const entry = this.#index.get(name)
    if (!entry) {
      throw new DIControllerError('No registered entry was found with the provided name')
    }
    return entry
  }

  /**
   * Get an object entry's object
   * by the name of the entry
   * @param { String } name
   * @returns { any }
   */
  #getObject (name) {
    const entry = this.#getEntry(name)
    if (!entry?.object) {
      throw new DIControllerError('Missing object for entry')
    }
    return entry.object
  }

  /**
   * Get an object entry's requirements
   * by the name of the entry
   * @param { String } name
   * @returns { String[] }
   */
  #getRequirements (name) {
    const entry = this.#getEntry(name)
    return entry?.requirements || []
  }
}

module.exports = DIController
