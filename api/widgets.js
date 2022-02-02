/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  registerWidget: registerWidget
 * }} Widgets
 */

const state = require('./state')

/**
 * Make a widget available
 * to the application
 * @param { String } id A unique identifier for the widget, SHOULD follow
 *                      the format of [plugin bundle id].widget-name
 * @param { String } name A human readable name for the widget
 * @param { String } uri The widget's entrypoint uri
 */
function registerWidget (id, name, uri) {
  state.apply({
    _widgets: {
      [id]: { name, uri }
    }
  })
}
exports.registerWidget = registerWidget
