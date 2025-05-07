const uuid = require('uuid')

/**
 * Converts a list of file paths into a nested folder structure
 * The function assumes that paths are strings with folders and files separated by '/'
 *
 * @param {Array} paths - An array of path objects, where each object contains at least a name and whole path
 * @returns {Array} - A nested folder structure represented as an array of folder objects
 */
function buildFolderTree (paths) {
  if (!paths) return []

  const root = []
  const delimiters = /[\/\\]+/ // eslint-disable-line 

  for (const path of paths) {
    // Split the path into parts by '/' or '\' and remove any empty segments
    const parts = path.name.split(delimiters).filter(Boolean)

    // If path ends with a delimiter, it's a folder path
    const isFolderPath = /[\/\\]$/.test(path.name) // eslint-disable-line

    let currentLevel = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const isFile = !isFolderPath && isLast // Only the last part can be a file
      const pwd = parts.slice(0, index + 1).join('/') // Join parts to get the path

      let existing = currentLevel.find((item) => item.name === part) // Check if folder exists on current level

      if (!existing) { // If it does not exist then create it.
        if (isFile) {
          existing = {
            ...path,
            file: true,
            name: pwd,
            id: uuid.v4()
          }
        } else { // It is a folder then save name instead of path
          existing = {
            file: false,
            name: part,
            id: uuid.v4(),
            files: []
          }
        }
        currentLevel.push(existing) // Save folder or file to current level
      }

      if (!isFile) {
        currentLevel = existing.files // If the current item is a folder, go deeper
      }
    })
  }
  return root
}
exports.buildFolderTree = buildFolderTree

/**
 * Extracts the file name from a given path. Delimited by '/'.
 *
 * @param {string} path The full file path.
 * @returns {string} The file name from the path.
 */
function getFileName (path) {
  if (!path) {
    return ''
  }

  // Normalize the path by removing leading/trailing slashes
  path = path.replace(/^\/+|\/+$/g, '') // Unix-style paths
  path = path.replace(/^\\+|\\+$/g, '') // Windows-style paths

  // Handle edge case where the path is just a slash
  if (!path) {
    return ''
  }

  // Split the path using both slashes and backslashes
  /* eslint-disable-next-line no-useless-escape */
  const parts = path.split(/[\/\\]+/)

  // Return the last part of the path, which should be the file name
  return parts[parts.length - 1] || ''
}
exports.getFileName = getFileName
