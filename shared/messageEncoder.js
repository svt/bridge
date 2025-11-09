/**
 * Define what each of the keys in
 * messages should be encoded as,
 *
 * this will be used in reverse
 * for decoding
 */
const ENCODING_TABLE = {
  command: 'c',
  args: 'a',
  refresh: 'r',
  type: 't',
  headers: 'h'
}

const DECODING_TABLE = invert(ENCODING_TABLE)

/**
 * Invert an object
 *
 * This will turn the object's values
 * into keys and keys into values
 *
 * @param { any } obj
 * @returns { any } A new object
 */
function invert (obj) {
  const out = {}
  for (const key of Object.keys(obj)) {
    out[obj[key]] = key
  }
  return out
}

/**
 * Encode an object following a table,
 * this will rename the object's keys
 * to the values stored in the table provided
 *
 * @example
 * table = { foo: 'bar' }
 * obj = { foo: 'Hello World' }
 * returns = { bar: 'Hello World' }
 *
 * @param { any } table
 * @param { any } obj
 * @returns { any } A new object
 */
function encodeObj (table, obj) {
  const out = {}
  for (const key of Object.keys(obj)) {
    if (table[key]) {
      out[table[key]] = obj[key]
    } else {
      out[key] = obj[key]
    }
  }
  return out
}

/**
 * Encode a message to be
 * sent over web sockets
 *
 * ...to at least reduce some
 * of the unnecessary bytes
 *
 * @param { any } message
 * @returns { any } A new object
 */
function encodeMessage (message) {
  return encodeObj(ENCODING_TABLE, message)
}
exports.encodeMessage = encodeMessage

/**
 * Decode a message that was send over
 * web sockets to its original form
 * @param { any } message
 * @returns { any } A new object
 */
function decodeMessage (message) {
  return encodeObj(DECODING_TABLE, message)
}
exports.decodeMessage = decodeMessage
