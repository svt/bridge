import React from 'react'
import bridge from 'bridge'

import { Library } from '../components/Library'
import { ModalFooter } from '../components/ModalFooter'
import { Modal } from '../../../../app/components/Modal'

/**
 * @typedef {{
 *  serverId: String
 * }} Filter
 */
export const LibraryModal = () => {
  const [items, setItems] = React.useState()
  const [modalId, setModalId] = React.useState()
  const [firstItem, setFirstItem] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setModalId(params.get('modalId'))
  }, [])

  React.useEffect(() => {
    async function getSelectedItems () {
      const selection = await bridge.client.selection.getSelection()
      setItems(selection)

      const firstItemId = selection?.[0]
      const item = await bridge.items.getItem(firstItemId)
      setFirstItem(item)
    }
    getSelectedItems()
  }, [])

  function handleModalClose () {
    if (!modalId) {
      return
    }
    bridge.ui.modal.close(modalId)
  }

  return (  
    <div className='View--flex'>
      <Library highlightItem={firstItem?.data?.caspar?.target} serverId={firstItem?.data?.caspar?.server} />
      <ModalFooter numItemsSelected={items?.length} onModalClose={() => handleModalClose()} />
    </div>
  )
}
