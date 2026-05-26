// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Thin wrappers around Electrobun's Utils dialogs that match the return
shapes callers (`save`, `saveAs`, close-confirm) use.

Electrobun has no native save-file dialog. `showSaveDialog` falls back
to a folder picker plus a synthesised "Untitled" filename — see #6 in
the migration follow-up tasks for the renderer-side replacement.
*/

const path = require('node:path')
const ProjectFile = require('../ProjectFile')
const { Utils } = globalThis.__ELECTROBUN__

/**
 * @typedef { Object } OpenDialogResult
 * @property { boolean } canceled
 * @property { string[] } filePaths
 */

/**
 * @param { Object } opts
 * @param { Array<{name: string, extensions: string[]}> } [opts.filters]
 * @param { string[] } [opts.properties]
 * @returns { Promise<OpenDialogResult> }
 */
async function showOpenDialog (opts = {}) {
  const allowedFileTypes = (opts.filters || [])
    .flatMap(f => f.extensions)
    .join(',') || '*'

  const props = new Set(opts.properties || ['openFile'])

  const paths = await Utils.openFileDialog({
    allowedFileTypes,
    canChooseFiles: props.has('openFile'),
    canChooseDirectory: props.has('openDirectory'),
    allowsMultipleSelection: props.has('multiSelections')
  })

  const filePaths = paths.filter(p => p && p.length > 0)
  return {
    canceled: filePaths.length === 0,
    filePaths
  }
}
exports.showOpenDialog = showOpenDialog

/**
 * @typedef { Object } SaveDialogResult
 * @property { boolean } canceled
 * @property { string } [filePath]
 */

/**
 * Stand-in for dialog.showSaveDialog: ask the user to pick a folder,
 * then derive a filename from defaultPath. The renderer is expected to
 * prompt for the filename via a Bridge UI before reaching this point;
 * if `defaultPath` is missing, the filename component is left blank.
 *
 * @param { import('./Window') | null } _window
 * @param { Object } opts
 * @param { string } [opts.defaultPath]
 * @returns { Promise<SaveDialogResult> }
 */
/**
 * Escape a string for embedding in an AppleScript string literal.
 */
function escapeAppleScript (s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * macOS: drive the native NSSavePanel via `osascript`'s `choose file
 * name`. Returns the POSIX path the user picked, or canceled = true.
 */
async function showSaveDialogMacOS (opts) {
  const ext = '.' + ProjectFile.extensions.workspace

  let defaultName = opts.defaultPath
    ? path.basename(opts.defaultPath)
    : `Untitled${ext}`
  if (!defaultName.endsWith(ext)) defaultName += ext

  const defaultDir = opts.defaultPath
    ? path.dirname(opts.defaultPath)
    : path.join(process.env.HOME || '/', 'Documents')

  const script = `
    try
      set f to choose file name with prompt "Save workspace" default name "${escapeAppleScript(defaultName)}" default location POSIX file "${escapeAppleScript(defaultDir)}"
      return POSIX path of f
    on error number -128
      return ""
    end try
  `

  const proc = Bun.spawn(['osascript', '-e', script], {
    stdout: 'pipe',
    stderr: 'pipe'
  })
  await proc.exited

  const out = (await new Response(proc.stdout).text()).trim()
  if (!out) return { canceled: true }
  return { canceled: false, filePath: out }
}

/**
 * Folder-picker fallback for platforms where we don't yet have a
 * native save dialog implementation. The caller appends the workspace
 * extension; we return a path without it.
 */
async function showSaveDialogFolderPicker (opts) {
  const ext = '.' + ProjectFile.extensions.workspace
  const defaultBase = opts.defaultPath
    ? path.basename(opts.defaultPath)
    : 'Untitled'
  const baseNoExt = defaultBase.endsWith(ext)
    ? defaultBase.slice(0, -ext.length)
    : defaultBase
  const startingFolder = opts.defaultPath
    ? path.dirname(opts.defaultPath)
    : '~/'

  const paths = await Utils.openFileDialog({
    startingFolder,
    canChooseFiles: false,
    canChooseDirectory: true,
    allowsMultipleSelection: false
  })
  const folder = paths.find(p => p && p.length > 0)
  if (!folder) return { canceled: true }

  return { canceled: false, filePath: path.join(folder, baseNoExt) }
}

/**
 * Electrobun does not expose a save-file dialog. On macOS we shell out
 * to `osascript` to drive the native NSSavePanel — `choose file name`
 * gives a real save dialog with type-in filename, suggested location
 * and overwrite-confirm. Other platforms fall back to the folder-
 * picker workaround until they get a native path of their own.
 */
async function showSaveDialog (_window, opts = {}) {
  if (process.platform === 'darwin') {
    return showSaveDialogMacOS(opts)
  }
  return showSaveDialogFolderPicker(opts)
}
exports.showSaveDialog = showSaveDialog

/**
 * @param { import('./Window') | null } _window
 * @param { Object } opts
 * @returns { Promise<{ response: number }> }
 */
async function showMessageBox (_window, opts = {}) {
  return Utils.showMessageBox({
    type: opts.type ?? 'info',
    title: opts.title ?? '',
    message: opts.message ?? '',
    detail: opts.detail ?? '',
    buttons: opts.buttons ?? ['OK'],
    defaultId: opts.defaultId ?? 0,
    cancelId: opts.cancelId ?? -1
  })
}
exports.showMessageBox = showMessageBox
