import * as api from '../api'

export function isElectron () {
  return window.navigator.userAgent.includes('Bridge')
}

export function isMacOS () {
  return window.APP.platform === 'darwin'
}

export function isWindows () {
  return window.APP.platform === 'win32'
}

export function getWindowId () {
  return window.BRIDGE_WINDOW_ID
}

export async function setStayOnTop (newValue) {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.setStayOnTop', getWindowId(), !!newValue)
}

export async function toggleMaximize () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.toggleMaximize', getWindowId())
}

export async function minimize () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.minimize', getWindowId())
}

export async function close () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.close', getWindowId())
}

export async function setControlColors (colors) {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.setControlColors', getWindowId(), colors)
}
