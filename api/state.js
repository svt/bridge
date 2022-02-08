/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

const commands = require('./commands')

/**
 * Apply some data to the state,
 * most often this function shouldn't
 * be called directly - there's probably
 * a command for what you want to do
 * @param { Object } set Data to apply to the state
 */
function apply (set) {
  commands.executeRawCommand('state.apply', set)
}
exports.apply = apply
