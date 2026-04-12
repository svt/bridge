import React from 'react'
import bridge from 'bridge'

import { Library } from '../components/Library'
import { ModalFooter } from '../components/ModalFooter'
import { ModalHeader } from '../components/ModalHeader'

/**
 * @typedef {{
 *  serverId: String
 * }} Filter
 */
export const LibraryModal = () => {
  const [selection, setSelection] = React.useState([])
  const [modalId, setModalId] = React.useState()
  const [firstItem, setFirstItem] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setModalId(params.get('modalId'))
  }, [])

  React.useEffect(() => {
    async function getSelectedItems () {
      const selection = await bridge.client.selection.getSelection()
      setSelection(selection)

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

  /**
   * Apply the asset's properties
   * to the selected items
   */
  async function handleItemDoubleClick (item) {
    if (
      !Object.prototype.hasOwnProperty.call(item?.data?.caspar, 'server') ||
      !Object.prototype.hasOwnProperty.call(item?.data?.caspar, 'target')
    ) {
      return
    }

    const set = {
      data: {
        caspar: {
          server: item?.data?.caspar?.server,
          target: item?.data?.caspar?.target,
          frameRate: item?.data?.caspar?.frameRate
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(item?.data, 'duration')) {
      set.data.duration = item.data.duration
    }

    for (const id of selection) {
      await bridge.items.applyItem(id, JSON.parse(JSON.stringify(set)), true)
    }
    handleModalClose()
  }

  return (  
    <div className='View--flex'>
      <ModalHeader title='Edit target' />
      <Library
        highlightItem={firstItem?.data?.caspar?.target}
        serverId={firstItem?.data?.caspar?.server}
        onItemDoubleClick={item => handleItemDoubleClick(item)}
      />
      <ModalFooter numItemsSelected={selection?.length} onModalClose={() => handleModalClose()} />
    </div>
  )
}
