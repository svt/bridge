// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { Router } = require('express')
const router = new Router()

const TemplateLoader = require('../../../template/TemplateLoader')

const paths = require('../../../paths')
const utils = require('../../../utils')

;(function () {
  TemplateLoader.getInstance().setPath(paths.templates)
})()

router.get('/', utils.promiseMiddleware(async () => {
  const templates = await TemplateLoader.getInstance().list()
  return {
    status: 'ok',
    items: templates
  }
}))

module.exports = router
