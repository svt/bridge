import * as api from '../../api'

export function isElectron () {
  return window.navigator.userAgent.includes('Bridge')
}

export function isMacOS () {
  return window.APP.platform === 'darwin'
}

export function isWindows () {
  return window.APP.platform === 'windows'
}

export async function toggleMaximize () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.toggleMaximize')
}

export async function minimize () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.minimize')
}

export async function close () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeRawCommand('window.close')
}
