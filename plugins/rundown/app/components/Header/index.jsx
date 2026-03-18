import React from 'react'
import bridge from 'bridge'

import './style.css'

import { Icon } from '../../../../../app/components/Icon'

import * as config from '../../config'
import * as contextMenu from '../../utils/contextMenu'

export function Header () {
  const [rundownInfo, setRundownInfo] = React.useState()

  async function handleCreateOnClick (e) {
    e.preventDefault()

    const types = await bridge.state.get('_types')
    const spec = contextMenu.generateAddContextMenuItems(types, typeId => handleAdd(typeId))

    bridge.ui.contextMenu.open(spec, {
      searchable: true,
      ...bridge.ui.contextMenu.getPositionFromEvent(e)
    })
  }

  /**
   * Add a new item to the
   * end of the rundown
   */
  async function handleAdd (typeId) {
    const itemId = await bridge.items.createItem(typeId)
    bridge.commands.executeCommand('rundown.appendItem', rundownInfo?.id, itemId)
  }

  /**
   * Load the main rundown
   * in the widget
   */
  function handleLoadMainRundown () {
    window.WIDGET_UPDATE({
      'rundown.id': config.DEFAULT_RUNDOWN_ID
    })
  }

  /*
  Setup the rundownInfo-state containing
  the id and name of the current rundown item
  in order to display the path
  */
  React.useEffect(() => {
    async function setup () {
      const id = window.WIDGET_DATA?.['rundown.id'] || config.DEFAULT_RUNDOWN_ID

      const itemData = await (async function () {
        if (id === config.DEFAULT_RUNDOWN_ID) {
          return {}
        }
        const item = await bridge.items.getItem(id)
        return item?.data
      })()

      /*
      Load the main rundown if the
      current rundown cannot be found,

      otherwise the rundown may still
      try to display a group that has
      been removed
      */
      if (!itemData) {
        handleLoadMainRundown()
        return
      }

      setRundownInfo({ id, name: itemData.name })
    }
    setup()
  }, [])

  return (
    <header className='Header'>
      <div className='Header-section'>
        <button className='Button Button--small Button--ghost Header-addBtn' onClick={e => handleCreateOnClick(e)}>
          <Icon name='add' /> Add
        </button>
      </div>
      <div className='Header-section'>
        <div className='Header-path'>
          <span className='Header-pathPart is-clickable' onClick={() => handleLoadMainRundown()}>Main rundown</span>
          {
            rundownInfo?.name &&
            <span className='Header-pathPart'> / {rundownInfo?.name}</span>
          }
        </div>
      </div>
    </header>
  )
}
