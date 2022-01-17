/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

/**
 * @param { import(".").PluginContext } context
 */
function factory (context) {
  context.component = {}
  context._components = {}

  /**
   * Register a new component
   * for this plugin
   * @param { String } id A unique identifier for the component
   * @param { Component } component
   */
  context.component.register = (id, component) => {
    /*
    Keep a reference to the
    component in the context
    */
    context._components[id] = component

    /*
    Update the state to make the
    component available in the UI
    */
    context.state.apply({
      components: {
        [`${context.manifest.bundle}.${id}`]: {
          id,
          name: component.name,
          bundle: context.manifest.bundle
        }
      }
    })
  }
}
exports.factory = factory
