// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const path = require('path')

fs.rmSync(path.join(__dirname, '../dist'), { recursive: true, force: true })