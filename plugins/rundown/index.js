/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */
/*
const manifest = require('./manifest.json')
const assets = require('../../assets.json')
 */
const bridge = require('bridge')

exports.activate = () => {
  bridge.communicator.send({ foo: 'bar' })

  /*
    context.component.register('rundown', new RundownComponent())
    const url = context.file.serve(`/dist/${assets.hash}.${context.manifest.bundle}.bundle.js`)
    console.log(url)
  */
}
