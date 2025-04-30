/**
 * Converts a list of file paths into a nested folder structure
 * The function assumes that paths are strings with folders and files separated by '/'
 *
 * @param {Array} paths - An array of path objects, where each object contains at least a name and whole path
 * @returns {Array} - A nested folder structure represented as an array of folder objects
 */
export function buildFolderTree (paths) {
  const root = []

  for (const path of paths) {
    const parts = path.name.split('/')
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
            id: crypto.randomUUID()
          }
        } else {
          existing = {
            file: false,
            name: part,
            target: pwd,
            id: crypto.randomUUID(),
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
 * Formats a string to have uppercase in the beginning.
 * @param {*} str String to format
 * @returns Formatted string with first case upper case and rest lower case
 */
export function toLowerCaseExceptFirst (str) {
  if (str.length === 0) {
    return str
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
