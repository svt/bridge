/**
 * Generate an unsafe random string of the
 * specified length, containing only characters
 * from the provided map
 * @param { Number } length
 * @param { String } map
 * @returns { String }
 */
function randomString (length = 5, map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += map[Math.round(Math.random() * map.length)]
  }
  return out
}
module.randomString = randomString

/**
 * Make a unique string id that isn't
 * in the provided list of existing ids
 *
 * Will recursively call itself if a proposed
 * id is colliding with an already existing one
 *
 * @param { Number } length
 * @param { String[] } existingIds
 * @returns { String }
 */
function makeUniqueId (length, existingIds = []) {
  const proposal = randomString(length)
  if (existingIds.includes(proposal)) {
    return makeUniqueId(existingIds)
  }
  return proposal
}
exports.makeUniqueId = makeUniqueId
