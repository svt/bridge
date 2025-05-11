const uuid = require('uuid')

/**
 * Regex pattern to match file path delimiters
 */
const FILE_PATH_DELIMITER = /[\/\\]+/ // eslint-disable-line

/**
 * Regex pattern to match paths that end with a delimiter
 */
const ENDS_WITH_DELIMITER = /[\/\\]$/ // eslint-disable-line 

/**
 * @typedef {{
 *   file: boolean
 *   name: string
 *   id: string
 *   path?: Object // Original path object that may contain properties like caspar, data, etc.
 * }} File
 *
 * @typedef {{
 *   file: boolean
 *   name: string
 *   id: string
 *   files?: Folder[] // Nested files or folders
 * }} Folder
 */

/**
 * Converts a list of file paths into a nested folder structure.
 * The function assumes that paths are strings with folders and files separated by '/' or '\'.
 * 
 * @param {{ name: string, [key: string]: any }[]} paths - An array of path objects with at least a `name` string.
 * @returns {Folder[Folder|File]} - A nested folder structure represented as an array of folder objects.
 * @example 
 * Input: [{ path.name: 'folder1/item' }]
 * Output: [
 *   {
 *     file: false,
 *     name: 'folder1',
 *     id: 'uuid',
 *     files: [
 *       {
 *          ...: existing properties,
 *          file: true,
 *          name: 'folder1/folder2/item',
 *          id: 'uuid'       
 *       }
 *     ]
 *   }
 * ]
 */
function buildFolderTree (paths) {
  if (!paths) return []

  const root = []

  for (const path of paths) {
    // Split the path into parts by '/' or '\' and remove any empty segments
    const parts = path.name.split(FILE_PATH_DELIMITER).filter(Boolean)

    const isFolderPath = ENDS_WITH_DELIMITER.test(path.name) // Check if the path ends with a delimiter

    let currentLevel = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1 && !isFolderPath // Only the last part can be a file, unless the path ends with a delimiter
      const pwd = parts.slice(0, index + 1).join('/') // Join parts to get the path

      let existing = currentLevel.find((item) => item.name === part) // Check if folder exists on current level

      // If the folder exists, go into it
      if (existing) {
        if (!isFile) {
          currentLevel = existing.files
        }
        return
      }
      
      // Create new folder or file object
      if (isFile) {
        existing = {
          ...path,
          file: true,
          name: pwd,
          id: uuid.v4()
        }
      } else {
        existing = {
          file: false,
          name: part,
          id: uuid.v4(),
          files: []
        }
      }

      // Add new object to current level
      currentLevel.push(existing)
      
      // Descend into if it's a folder
      if (!isFile) {
        currentLevel = existing.files
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
function getFileName(path) {
  // If path does not exist or path ends with a delimiter then return empty string.
  if (!path || ENDS_WITH_DELIMITER.test(path)) {
    return ''
  }

  //Split string and return the last part.
  const parts = path.split(FILE_PATH_DELIMITER)
  return parts[parts.length - 1] || ''
}
exports.getFileName = getFileName
