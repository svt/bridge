// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * Get the effective playback duration for an item,
 * taking inPoint and outPoint into account
 *
 * Falls back to data.duration when inPoint/outPoint are not set,
 * so items without trim points behave exactly as before
 *
 * @param { any } item
 * @returns { number }
 */
function getEffectiveDuration (item) {
  const duration = Number(item?.data?.duration) || 0
  const inPoint = Number(item?.data?.inPoint) || 0

  let outPoint = duration
  if (item?.data?.outPoint != null && item?.data?.outPoint !== '') {
    outPoint = Number(item.data.outPoint)
  }

  return Math.max(0, outPoint - inPoint)
}

exports.getEffectiveDuration = getEffectiveDuration
