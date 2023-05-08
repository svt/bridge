export function linear (t) {
  return t
}

export function easeNone (t) {
  return t
}

export function easeInQuad (t) {
  return t * t
}

export function easeOutQuad (t) {
  return 1 - (1 - t) * (1 - t)
}

export function easeInOutQuad (t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2
}

export function easeOutInQuad (t) {
  return t < 0.5 ? 0.5 * (1 - (1 - 2 * t) * (1 - 2 * t)) : 0.5 * (1 + (2 * t - 1) * (2 * t - 1))
}

export function easeInCubic (t) {
  return t * t * t
}

export function easeOutCubic (t) {
  return 1 - (1 - t) * (1 - t) * (1 - t)
}

export function easeInOutCubic (t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) / 2
}

export function easeOutInCubic (t) {
  return t < 0.5 ? 0.5 * (1 - (1 - 2 * t) * (1 - 2 * t) * (1 - 2 * t)) : 0.5 * (1 + (2 * t - 1) * (2 * t - 1) * (2 * t - 1))
}

export function easeInQuart (t) {
  return t * t * t * t
}

export function easeOutQuart (t) {
  return 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t)
}

export function easeInOutQuart (t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) / 2
}

export function easeOutInQuart (t) {
  return t < 0.5 ? 0.5 * (1 - (1 - 2 * t) * (1 - 2 * t) * (1 - 2 * t) * (1 - 2 * t)) : 0.5 * (1 + (2 * t - 1) * (2 * t - 1) * (2 * t - 1) * (2 * t - 1))
}

export function easeInQuint (t) {
  return t * t * t * t * t
}

export function easeOutQuint (t) {
  return 1 + (--t) * t * t * t * t
}

export function easeInOutQuint (t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2) / 2
}

export function easeOutInQuint (t) {
  return t < 0.5 ? 0.5 * (1 - (1 - 2 * t) * (1 - 2 * t) * (1 - 2 * t) * (1 - 2 * t) * (1 - 2 * t)) : 0.5 * (1 + (2 * t - 1) * (2 * t - 1) * (2 * t - 1) * (2 * t - 1) * (2 * t - 1))
}

export function easeInSine (t) {
  return 1 - Math.cos(t * Math.PI / 2)
}

export function easeOutSine (t) {
  return Math.sin(t * Math.PI / 2)
}

export function easeInOutSine (t) {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

export function easeOutInSine (t) {
  return t < 0.5 ? Math.sin(Math.PI * t) / 2 : 1 - Math.cos(Math.PI * (2 * t - 1)) / 2
}

export function easeInExpo (t) {
  return Math.pow(2, 10 * (t - 1))
}

export function easeOutExpo (t) {
  return 1 - Math.pow(2, -10 * t)
}

export function easeInOutExpo (t) {
  return t < 0.5 ? 0.5 * Math.pow(2, 10 * (2 * t - 1)) : 0.5 * (2 - Math.pow(2, -10 * (2 * t - 1)))
}

export function easeOutInExpo (t) {
  return t < 0.5 ? 0.5 * (1 - Math.pow(2, -20 * t)) : 0.5 * (1 + Math.pow(2, 20 * t - 20))
}

export function easeInCirc (t) {
  return 1 - Math.sqrt(1 - t * t)
}

export function easeOutCirc (t) {
  return Math.sqrt(1 - (1 - t) * (1 - t))
}

export function easeInOutCirc (t) {
  return t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(-4 * t * t + 8 * t - 3) + 1) / 2
}

export function easeOutInCirc (t) {
  return t < 0.5 ? 0.5 * Math.sqrt(1 - (1 - 2 * t) * (1 - 2 * t)) : 0.5 * (Math.sqrt(-4 * t * t + 8 * t) + 1)
}

export function easeInElastic (t) {
  return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.075) * (2 * Math.PI) / 0.3)
}

export function easeOutElastic (t) {
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

export function easeInOutElastic (t) {
  return t < 0.5 ? -0.5 * Math.pow(2, 10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - 1.075) * (2 * Math.PI) / 0.3) : 0.5 * Math.pow(2, -10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - 0.075) * (2 * Math.PI) / 0.3) + 1
}

export function easeOutInElastic (t) {
  return t < 0.5 ? 0.5 * Math.pow(2, -20 * t) * Math.sin((20 * t - 0.225) * (2 * Math.PI) / 0.45) + 0.5 : -0.5 * Math.pow(2, 20 * (t - 0.5)) * Math.sin((20 * (t - 0.5) - 0.225) * (2 * Math.PI) / 0.45) + 0.5
}

export function easeInBack (t) {
  const s = 1.70158
  return t * t * ((s + 1) * t - s)
}

export function easeOutBack (t) {
  const s = 1.70158
  return 1 - (1 - t) * (1 - t) * ((s + 1) * (1 - t) - s)
}

export function easeInOutBack (t) {
  const s = 1.70158 * 1.525
  return t < 0.5 ? 2 * t * t * ((s + 1) * 2 * t - s) : 1 - 2 * (1 - t) * (1 - t) * ((s + 1) * 2 * (1 - t) - s)
}

export function easeOutInBack (t) {
  return t < 0.5 ? 0.5 * (1 - (1 - 2 * t) * (1 - 2 * t) * ((1.70158 * 1.525 + 1) * (1 - 2 * t) - 1.70158 * 1.525)) : 0.5 * (1 + (1 - 2 * t) * (1 - 2 * t) * ((1.70158 * 1.525 + 1) * (2 * t - 1) + 1.70158 * 1.525))
}

export function easeOutBounce (t) {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t
  } else if (t < 2 / 2.75) {
    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
  } else if (t < 2.5 / 2.75) {
    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
  } else {
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
  }
}

export function easeInBounce (t) {
  return 1 - easeOutBounce(1 - t)
}

export function easeInOutBounce (t) {
  return t < 0.5 ? 0.5 * easeInBounce(2 * t) : 0.5 * easeOutBounce(2 * t - 1) + 0.5
}

export function easeOutInBounce (t) {
  return t < 0.5 ? 0.5 * easeOutBounce(2 * t) : 0.5 * easeInBounce(2 * t - 1) + 0.5
}
