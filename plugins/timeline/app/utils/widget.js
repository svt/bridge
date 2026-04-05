import { LazyValue } from './LazyValue'

const value = new LazyValue()

;(function () {
  Object.defineProperty(window, 'BRIDGE_WIDGET_IS_FLOATED', {
    configurable: true,
    set: newValue => {
      value.set(newValue)
    },
    get: () => value.get()
  })
})()

/**
 * A lazy value indicating whether
 * this widget is floating or not
 * @returns { Promise.<any> }
 */
export const isFloated = () => value.get()
