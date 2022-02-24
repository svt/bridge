// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Generate a random number
 * @param { Number } length The length of the number to generate
 * @returns { Number }
 */
export function number (length = 5) {
  return Math.floor(Math.random() * Math.pow(10, length))
}
