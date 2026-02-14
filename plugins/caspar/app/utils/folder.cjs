const uuid = require('uuid')

/**
 * Regex pattern to match file path delimiters
 */
const FILE_PATH_DELIMITER = /[\/\\]+/

/**
 * Regex pattern to match paths that end with a delimiter
 */
const FOLDER_END_DELIMITER = /[\/\\]$/

/**
 * @typedef {{
 *    file: true,   // Indicates this is a file
 *    name: string, // The name of the file 
 *    id: string,   // A unique identifier for the file
 *    path?: Object // Additional properties (e.g., caspar, data, etc.)
 * }} File
 * 
 * @typedef {{
 *   file: false,             // Indicates this is a folder (not a file)
 *   name: string,            // The name of the folder
 *   id: string,              // A unique identifier for the folder
 *   files: (Folder | File)[] // Array of nested files and/or folders
 * }} Folder
 */

/**
 * Converts a list of file paths into a nested folder structure.
 * The function assumes that paths are strings with folders and files separated by '/', '\' or multiples.
 * 
 * @param {{ name: string, [key: string]: any }[]} items - An array of path objects with at least a `name` string.
 * @returns {Folder[]} - A nested folder structure represented as an array of folder objects.
 * @example 
 * Input: [{ path.name: 'folder1/item' }]
 * Output: [
 *   {
 *     file: false,
 *     name: 'folder1',
 *     id: 'uuid1',
 *     files: [
 *       {
 *          ...: existing properties,
 *          file: true,
 *          name: 'folder1/item',
 *          id: 'uuid2'       
 *       }
 *     ]
 *   }
 * ]
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
      const isFile = !isFolderPath && isLast
      const pwd = parts.slice(0, index + 1).join('/')

      let existing = currentLevel.find((item) => item.name === part && item.file === false)

      if (!existing) {
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
        currentLevel.push(existing) 
      }

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