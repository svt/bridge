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
function buildFolderTree (items) {
  if (!items) return []

  const root = []

  for (const item of items) {
    const parts = item.name.split(FILE_PATH_DELIMITER).filter(Boolean) // Split the path into parts by '/' or '\' and remove any empty segments
    const isFolderPath = FOLDER_END_DELIMITER.test(item.name) // 
    let currentLevel = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1 // Only the last part can be a file
      const isFile = isLast && !isFolderPath // It can be a file if the last part and not a folderpath
      const fullPath = parts.slice(0, index + 1).join('/') // Join parts to get the full path

      // If it is a file then add it to level and return.
      if (isFile) {
        // Do not add if a file of the same type and location exists
        if (currentLevel.find((entry) => entry.name === fullPath && entry.type === item.type && entry.file === true))
          return
        currentLevel.push({
          ...item,
          file: true,
          name: fullPath,
          id: uuid.v4()
        })
        return
      }

      // Check if a folder exists on current level of the same type
      let existing = currentLevel.find((entry) => entry.name === part && entry.type === item.type && entry.file === false)
    
      // Create a new folder if it does not exist
      if (!existing) {
        existing = {
          file: false,
          name: part,
          id: uuid.v4(),
          type: item.type,
          files: []
        }
        currentLevel.push(existing)
      }

      //Make sure the existing folder has a file entry
      if (!Array.isArray(existing.files)) {
        existing.files = []
      }

      // Go deeper into new or existing folder
      currentLevel = existing.files
    })
  }
  return root
}
exports.buildFolderTree = buildFolderTree

/**
 * Extracts the file name from a given path. Delimited by '/'.
 *
 * @param {string} filePath The full file path.
 * @returns {string} The file name from the path.
 */
function getFileName(filePath) {
  // If path does not exist or path ends with a delimiter then return empty string.
  if (!filePath || FOLDER_END_DELIMITER.test(filePath)) {
    return ''
  }

  //Split string and return the last part.
  const parts = filePath.split(FILE_PATH_DELIMITER)
  return parts[parts.length - 1] || ''
}
exports.getFileName = getFileName
