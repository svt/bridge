// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const Shortcuts = require('../shared/shortcuts')

DIController.main.register('Shortcuts', Shortcuts, [
  /*
  This list must include requirements
  from the base Shortcuts class
  */
  'State',
  'Commands'
])