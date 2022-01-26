/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

const commands = require('./commands')

function apply (set) {
  commands.executeRawCommand('state.apply', set)
}
exports.apply = apply
