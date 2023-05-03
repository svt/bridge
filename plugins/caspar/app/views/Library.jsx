import React from 'react'
import bridge from 'bridge'

import { LibraryHeader } from '../components/LibraryHeader'
import { LibraryList } from '../components/LibraryList'

import * as Asset from '../utils/asset'

export const Library = () => {
  const [items, setItems] = React.useState([])

  /**
   * Filter is an object containing parameters
   * determining which media files to list
   *
   * @typedef {{
   *  serverId: String
   * }} Filter
   *
   * @type {[Filter, Function]}
   */
  const [filter, setFilter] = React.useState({})

  React.useEffect(() => {
    async function exec () {
      if (!filter.serverId) {
        setItems([])
        return
      }
      const res = await bridge.commands.executeCommand('caspar.server.cachedCommand', filter.serverId, 'cls')
      const filtered = (res?.data || [])
        .map(Asset.parseAsset)
      setItems(filtered)
    }
    exec()
  }, [filter, activeTab])

  return (
    <div className='View--flex'>
      <LibraryHeader onChange={filter => setFilter(filter)} />
      <LibraryList items={items} />
    </div>
  )
}
