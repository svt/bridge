function zeroPad (n) {
  if (n < 10) {
    return `0${n}`
  }
  return `${n}`
}

/**
 * Format a date as a string according to a pattern
 * @param { Date } d
 * @param { string } pattern
 * @returns { string }
 */
export function format (d, pattern = 'Y-M-D h:m:s') {
  const parts = {
    Y: d.getFullYear(),
    M: d.getMonth() + 1,
    D: d.getDate(),
    h: d.getHours(),
    m: d.getMinutes(),
    s: d.getSeconds()
  }

  return pattern
    .split('')
    .map(char => {
      if (Object.prototype.hasOwnProperty.call(parts, char)) {
        return zeroPad(parts[char])
      }
      return char
    })
    .join('')
}
