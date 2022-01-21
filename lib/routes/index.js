/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const fs = require('fs')

const { Router } = require('express')
const router = new Router()

const HttpError = require('../error/HttpError')

router.use((req, res, next) => {
  if (!req.workspace) {
    const err = new HttpError('No such workspace', 'ERR_MISSING_WORKSPACE', 400)
    return next(err)
  }
  next()
})

/*
Serve static files
registered by plugins
*/
router.get('/plugins/:bundle/static/:file', (req, res, next) => {
  const ctx = req.workspace.contexts.get(req.params.bundle)
  const file = ctx?._files[req.params.file]

  try {
    const rs = fs.createReadStream(file)
    rs.pipe(res)
  } catch (_) {
    const err = new HttpError('Bundle or file not found', 'ERR_BUNDLE_OR_FILE_NOT_FOUND', 404)
    return next(err)
  }
})

router.get('/plugins/:bundle/components/:component', (req, res, next) => {
  const ctx = req.workspace.contexts.get(req.params.bundle)
  const component = ctx._components[req.params.component]

  if (!component) {
    const err = new HttpError('Component not found', 'ERR_COMPONENT_NOT_FOUND', 404)
    return next(err)
  }

  if (typeof component.getHtml !== 'function') {
    const err = new HttpError('Component is missing the required getHTML function', 'ERR_INVALID_COMPONENT', 400)
    return next(err)
  }

  res
    .contentType('html')
    .send(component.getHtml())
})

module.exports = router
