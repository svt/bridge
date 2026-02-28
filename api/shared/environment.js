function isNode () {
  return !!module.parent
}
exports.isNode = isNode

function isBrowser () {
  return typeof window !== 'undefined'
}
exports.isBrowser = isBrowser
