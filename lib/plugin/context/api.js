/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

function factory (context) {
  const activate = context.activate
  context.activate = (...args) => {
    activate(...args)

    /*
    Worker thread is available as
    context.worker, attach api
    */
    context.worker.on('message', msg => {
      console.log('Received message', msg)
    })
    context.worker.postMessage({ foo: 'bar' })
  }
}
exports.factory = factory
