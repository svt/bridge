// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Replacement for Electron's powerSaveBlocker.

- macOS: spawn `caffeinate -di -w <pid>`. The -w flag keeps caffeinate
  alive for as long as the Bun process is running; if Bun dies, caffeinate
  exits cleanly so the OS can sleep again.

- Windows: call SetThreadExecutionState via bun:ffi against kernel32.dll
  with ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED. Calling
  with ES_CONTINUOUS alone clears it.

- Linux / unsupported: no-op.
*/

const Logger = require('../Logger')

const logger = new Logger({ name: 'powerSaveBlocker' })

let caffeinate = null
let winFFI = null

const ES_CONTINUOUS = 0x80000000
const ES_SYSTEM_REQUIRED = 0x00000001
const ES_DISPLAY_REQUIRED = 0x00000002

function startMacOS () {
  if (caffeinate) return
  caffeinate = Bun.spawn(['caffeinate', '-di', '-w', String(process.pid)], {
    stdout: 'ignore',
    stderr: 'ignore'
  })
  caffeinate.exited.then(code => {
    logger.debug('caffeinate exited', code)
    caffeinate = null
  })
}

function stopMacOS () {
  if (caffeinate && !caffeinate.killed) {
    caffeinate.kill('SIGTERM')
  }
  caffeinate = null
}

function startWindows () {
  if (winFFI) return
  try {
    const { dlopen, FFIType } = require('bun:ffi')
    winFFI = dlopen('kernel32.dll', {
      SetThreadExecutionState: {
        args: [FFIType.u32],
        returns: FFIType.u32
      }
    })
    winFFI.symbols.SetThreadExecutionState(
      ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
    )
  } catch (err) {
    logger.warn('Failed to start power-save blocker on Windows', err)
    winFFI = null
  }
}

function stopWindows () {
  if (!winFFI) return
  try {
    winFFI.symbols.SetThreadExecutionState(ES_CONTINUOUS)
    winFFI.close()
  } catch (err) {
    logger.warn('Failed to stop power-save blocker on Windows', err)
  }
  winFFI = null
}

/**
 * Prevent the system from sleeping while the app is running.
 * Safe to call multiple times; only the first call has effect.
 */
function start () {
  if (process.platform === 'darwin') return startMacOS()
  if (process.platform === 'win32') return startWindows()
}
exports.start = start

/**
 * Release the power-save block.
 */
function stop () {
  if (process.platform === 'darwin') return stopMacOS()
  if (process.platform === 'win32') return stopWindows()
}
exports.stop = stop
