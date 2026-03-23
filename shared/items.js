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
  const outPoint = item?.data?.outPoint != null ? Number(item.data.outPoint) : duration
  return Math.max(0, outPoint - inPoint)
}

exports.getEffectiveDuration = getEffectiveDuration
