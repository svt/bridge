function normalizeDataPath (propertyPath) {
  let path = String(propertyPath || '')
  if (path.indexOf('data.') !== 0) {
    path = 'data.' + path
  }
  return path
}

module.exports = normalizeDataPath
