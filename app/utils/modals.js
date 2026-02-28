/**
 * This file maintains a stack of modals
 * so that they can be closed by keyboard
 * shortcuts in the correct order
 */

const modalStack = []

function getModalWithId (id) {
  return modalStack.find(({ id: _id }) => id === _id)
}

function getNewModalId () {
  const proposal = Math.floor(Math.random() * 10000)
  if (getModalWithId(proposal)) {
    return getNewModalId()
  }
  return proposal
}

/*
Add a global listener for key down events
so that modals close in the correct order
*/
window.addEventListener('keyup', e => {
  if (e.key !== 'Escape') {
    return
  }

  const modalToClose = modalStack.pop()
  if (!modalToClose || typeof modalToClose?.onClose !== 'function') {
    return
  }
  modalToClose.onClose()
})

/**
 * Register that a new modal was opened
 * This will add it to the stack
 * along with its onClose callback
 *
 * @param { Function.<void> } onClose
 * @returns { string } The id to be used to remove
 *                     the modal in the future
 */
export function addToStack (onClose = () => {}) {
  const id = getNewModalId()
  modalStack.push({ id, onClose })
  return id
}

/**
 * Remove a modal from
 * the stack by its id
 *
 * @param { string } id The id of a modal
 * @returns { boolean } Whether the modal was
 *                      found and removed or not
 */
export function removeFromStack (id) {
  const index = modalStack.findIndex(({ id: _id }) => _id === id)
  if (index === -1) {
    return
  }
  modalStack.splice(index, 1)
  return true
}

/**
 * Get the current size
 * of the modal stack
 * @returns { number }
 */
export function stackSize () {
  return modalStack.length
}

/**
 * Check if there are
 * any open modals
 * @returns { boolean }
 */
export function hasOpenModal () {
  return stackSize() > 0
}
