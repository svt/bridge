// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { Router } = require('express')
const router = new Router()

const HttpError = require('../error/HttpError')
const StaticFileRegistry = require('../StaticFileRegistry')

router.get('/serve/:id', (req, res, next) => {
  const stream = StaticFileRegistry.getInstance().createReadStream(req.params.id)
  if (!stream) {
    const err = new HttpError('File not found', 'ERR_NOT_FOUND', '404')
    return next(err)
  }
  stream.pipe(res)
})

module.exports = router
