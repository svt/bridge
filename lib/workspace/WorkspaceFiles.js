// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const paths = require('../paths')

const DEFAULT_TYPE = 'application/octet-stream'

/**
 * Describes a file stored in a project file
 */
class File {
  /**
   * A unique id, the sha256 hash of the contents
   * @type { String }
   */
  id

  /**
   * The mime type of the file
   * @type { String }
   */
  type

  /**
   * The size in bytes
   * @type { Number }
   */
  size

  constructor ({ id, type, size }) {
    this.id = id
    this.type = type || DEFAULT_TYPE
    this.size = size
  }
}

/**
 * Hash file contents as a hex sha256 digest
 * @param { Buffer } data
 * @returns { String }
 */
function hashContents (data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Throw if an id isn't a valid hash,
 * which also prevents path traversal
 * @param { String } id
 */
function assertValidId (id) {
  if (typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id)) {
    throw new Error('Invalid file id')
  }
}

/**
 * The additional files of a workspace,
 * stored on disk while the workspace is
 * open and written into the project file on save
 */
class WorkspaceFiles {
  /**
   * @type { Map.<String, File> }
   */
  #files = new Map()

  #dir

  /**
   * @param { String } workspaceId
   */
  constructor (workspaceId) {
    this.#dir = path.join(paths.temp, 'project-files', workspaceId)
  }

  /**
   * Get the absolute path of a stored file
   * @param { String } id
   * @returns { String? } Undefined if the file doesn't exist
   */
  getPath (id) {
    if (!this.#files.has(id)) {
      return
    }
    return path.join(this.#dir, id)
  }

  /**
   * List all files
   * @returns { File[] }
   */
  list () {
    return [...this.#files.values()]
  }

  /**
   * Get a file's description by id
   * @param { String } id
   * @returns { File? }
   */
  get (id) {
    return this.#files.get(id)
  }

  /**
   * Read the contents of a file
   * @param { String } id
   * @returns { Promise.<Buffer> }
   */
  async read (id) {
    const filePath = this.getPath(id)
    if (!filePath) {
      throw new Error('File not found')
    }
    return fs.promises.readFile(filePath)
  }

  /**
   * Store a file, identical contents
   * are only ever stored once
   * @param { Buffer } data
   * @param { String= } type A mime type
   * @returns { Promise.<File> }
   */
  async add (data, type) {
    const id = hashContents(data)
    const existing = this.#files.get(id)
    if (existing) {
      return existing
    }

    await fs.promises.mkdir(this.#dir, { recursive: true })
    await fs.promises.writeFile(path.join(this.#dir, id), data)

    const file = new File({ id, type, size: data.length })
    this.#files.set(id, file)
    return file
  }

  /**
   * Remove a file by its id
   * @param { String } id
   * @returns { Promise.<Boolean> } True if a file was removed
   */
  async remove (id) {
    const filePath = this.getPath(id)
    if (!filePath) {
      return false
    }
    this.#files.delete(id)
    await fs.promises.rm(filePath, { force: true })
    return true
  }

  /**
   * Remove all files from disk
   * @returns { Promise.<Void> }
   */
  async clear () {
    this.#files.clear()
    await fs.promises.rm(this.#dir, { recursive: true, force: true })
  }

  /**
   * Write all files and a manifest to a zip archive
   * @param { import('jszip') } zip
   */
  async writeToArchive (zip) {
    const files = this.list()
    zip.file('files.json', JSON.stringify(files), { binary: false })

    for (const file of files) {
      zip.file(`files/${file.id}`, await this.read(file.id))
    }
  }

  /**
   * Load files from a zip archive,
   * silently skipping missing or corrupt entries
   * @param { import('jszip') } zip
   */
  async readFromArchive (zip) {
    if (!zip.files['files.json']) {
      return
    }

    const manifest = JSON.parse(await zip.files['files.json'].async('text'))
    for (const entry of manifest) {
      assertValidId(entry.id)

      const zipFile = zip.files[`files/${entry.id}`]
      if (!zipFile) {
        continue
      }

      const data = await zipFile.async('nodebuffer')
      if (hashContents(data) !== entry.id) {
        continue
      }
      await this.add(data, entry.type)
    }
  }
}

module.exports = WorkspaceFiles
module.exports.File = File
module.exports.hashContents = hashContents
