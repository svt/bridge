// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')

/**
 * No-op class as this API
 * is only available
 * in browser processes
 */
class UI {}
DIController.main.register('UI', UI)
