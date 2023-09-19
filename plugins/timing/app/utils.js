function zeroPad (n) {
  if (n < 10) {
    return `0${n}`
  }
  return `${n}`
}

export function msToTime (ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms - hours * 1000 * 60 * 60) / (1000 * 60))
  const seconds = Math.floor((ms - hours * 1000 * 60 * 60 - minutes * 1000 * 60) / 1000)

  if (hours <= 0) {
    return `${zeroPad(minutes)}:${zeroPad(seconds)}`
  }
  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}`
}