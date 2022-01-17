/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const path = require('path')
const ContextError = require('../../error/ContextError')

function randomId (length = 5) {
  return `${Math.floor(Math.random() * Math.pow(10, length))}`
}

/**
 * @param { import(".").PluginContext } context
 */
function factory (context) {
  context.file = {}
  context._files = {}

  /**
   * Register a file to be
   * served by the component
   *
   * This is useful if a component requires
   * external assets such as js or css files
   * @param { String } componentId The identifier of the
   *                               component to serve the file
   * @param { String } file The path to the file to serve
   *
   * @returns { String } The path to the file as
   *                     served by the web server
   */
  context.file.serve = file => {
    if (!path.isAbsolute(file)) {
      throw new ContextError('The path to a file to serve must be absolute', 'ERR_COMPONENT_SERVE_RELATIVE_PATH')
    }

    /*
    Construct a filename with an appended
    random number to avoid collisions
    */
    const filename = `${path.basename(file)}_${randomId()}`
    context._files[filename] = file

    /*
    Construct the path to the file
    as it will be served by the server,

    this will be used by plugins to
    request their files
    */
    return `/plugins/${context.manifest.bundle}/static/${filename}`
  }
}
exports.factory = factory
