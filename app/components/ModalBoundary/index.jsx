import React from 'react'
import * as api from '../../api'

import { Modal } from '../Modal'
import { Frame } from '../Frame'

import './style.css'

/**
 * @param {{
 *  id: string,
 *  uri: string
 * }} ModalSpec
 */

export function ModalBoundary ({ children }) {
  const [bridge, setBridge] = React.useState()
  const [modals, setModals] = React.useState([])

  React.useEffect(() => {
    let bridge

    function onRequestModal (opts) {
      /*
      Append a new object for the opened
      modal to the end of the modals array
      */
      setModals(prev => [
        ...prev, { id: opts.id, uri: opts.uri }
      ])
    }

    async function setup () {
      bridge = await api.load()
      setBridge(bridge)
      bridge.events.on('ui.modal.open', onRequestModal)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('ui.modal.open', onRequestModal)
    }
  }, [])

  React.useEffect(() => {
    let bridge

    function onModalClose (id) {
      /*
      Update the modals array to set the
      open-flag to false, closing the modal
      */
      setModals(prev => prev.map(modal => {
        if (modal.id === id) {
          return {
            ...modal,
            open: false
          }
        }
        return modal
      }))
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('ui.modal.close', onModalClose)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('ui.modal.close', onModalClose)
    }
  }, [])

  function handleModalClose (id) {
    /*
    Mark the modal as closed so that an
    onTransitionEnd handler is added to the instance
    */
    setModals(prev => prev.map(modal => {
      if (modal.id !== id) return modal
      return { ...modal, open: false }
    }))
  }

  function handleTransitionEnd (id) {
    /*
    Remove the modal from the DOM
    when the transition has ended
    */
    setModals(prev => prev.filter(modal => {
      if (modal.id !== id) return true
      return modal.open !== false
    }))
  }

  return (
    <>
      {
        modals.map(modal => (
          <Modal
            key={modal.id}
            open={modal.open !== false}
            onClose={() => handleModalClose(modal.id)}
            onTransitionEnd={() => handleTransitionEnd(modal.id)}
          >
            <Frame className='ModalBoundary-frame' src={modal.uri} api={bridge} autoresize={false} />
          </Modal>
        ))
      }
      {children}
    </>
  )
}