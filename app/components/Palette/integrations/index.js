// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import items from './items'
import commands from './commands'

/**
 * Export all available integrations
 *
 * All integrations must export a definition object,
 * see the 'items' integration for an example
 *
 * An integration with a 'prefix' is only queried when the
 * input starts with it, all others are skipped in that case
 */
export default [
  items,
  commands
]
