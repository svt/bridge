const uuid = require('uuid')

/**
 * Converts a list of file paths into a nested folder structure
 * The function assumes that paths are strings with folders and files separated by '/'
 *
 * @param {Array} paths - An array of path objects, where each object contains at least a name and whole path
 * @returns {Array} - A nested folder structure represented as an array of folder objects
 */
function buildFolderTree (paths) {
  if (!paths) {
    return []
  }
  const root = []

  /* eslint-disable-next-line no-useless-escape */
  const delimiters = /[\/\\]+/

  for (const path of paths) {
    const parts = path.name.split(delimiters).filter(Boolean)
    let currentLevel = root

    parts.forEach((part, index) => {
      if (part.length === 0) {
        return // Skip empty parts, trailing '/'
      }
      const isFile = index === parts.length - 1 // Only last part is file

      let existing = currentLevel.find((item) => item.name === part) // Check if folder exists on current level

      if (!existing) { // If it does not exist then create it.
        const pwd = parts.slice(0, index + 1).join('/')
        if (isFile) {
          existing = {
            ...path,
            file: true,
            name: part,
            target: pwd,
            id: uuid.v4()
          }
        } else {
          existing = {
            file: false,
            name: part,
            target: pwd,
            id: uuid.v4(),
            files: []
          }
        }
        currentLevel.push(existing) // Save folder or file to current
      }

      if (!isFile) {
        currentLevel = existing.files // If the current item is a folder, go deeper
      }
    })
  }
  return root
}

/**
 * Extracts the file name from a given path. Delimited by '/'.
 *
 * @param {string} path The full file path.
 * @returns {string} The file name from the path.
 */
function getFileName(path) {
  if (!path) {
    return '';
  }

  // Normalize the path by removing leading/trailing slashes
  path = path.replace(/^\/+|\/+$/g, '');  // Unix-style paths
  path = path.replace(/^\\+|\\+$/g, '');  // Windows-style paths

  // Handle edge case where the path is just a slash
  if (!path) {
    return '';
  }

  // Split the path using both slashes and backslashes
  const parts = path.split(/[\/\\]+/);

  // Return the last part of the path, which should be the file name
  return parts[parts.length - 1] || '';
}

module.exports = {
  buildFolderTree,
  getFileName
}
