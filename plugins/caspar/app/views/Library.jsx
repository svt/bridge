import React from 'react'
import bridge from 'bridge'

import { LibraryHeader } from '../components/LibraryHeader'
import { LibraryList } from '../components/LibraryList'

import * as Asset from '../utils/asset'

/**
 * @typedef {{
 *  serverId: String
 * }} Filter
 */
export const Library = () => {
  const [items, setItems] = React.useState([])

  /**
   * Filter is an object containing parameters
   * determining which media files to list
   *
   * @type {[Filter, Function]}
   */
  const [filter, setFilter] = React.useState({})

  /**
   * A reference holding the filter as it was
   * during the last fetch in order to do
   * selective fetches based on what parts
   * of the filter is updated
   *
   * @type { Filter }
   */
  const lastFetchFilterRef = React.useRef({})

  React.useEffect(() => {
    async function exec () {
      if (!filter.serverId) {
        setItems([])
        return
      }

      /*
      Only do a new fetch if
      the server has changed
      */
      if (lastFetchFilterRef.current?.serverId === filter.serverId) {
        return
      }

      const res = await bridge.commands.executeCommand('caspar.server.cachedCommand', filter.serverId, 'cls')
      const filtered = (res?.data || [])
        .map(Asset.parseAsset)
      setItems(filtered)
    }
    exec()
  }, [filter])

  /**
   * An array of all items that matches
   * the current filter -
   * or more specifically the
   * query from the search input
   *
   * @type { any[] }
   */
  const filteredItems = React.useMemo(() => {
    const query = (filter?.query || '').toLowerCase()
    return items.filter(item => {
      return `${item.name || ''}`.toLowerCase()
        .indexOf(query) >= 0
    })
  }, [items, filter])

  return (
    <div className='View--flex'>
      <LibraryHeader onChange={filter => setFilter(filter)} />
      <LibraryList items={filteredItems} />
    </div>
  )
}
