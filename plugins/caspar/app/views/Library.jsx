import React from 'react'
import bridge from 'bridge'

import { LibraryHeader } from '../components/LibraryHeader'
import { LibraryList } from '../components/LibraryList'

import * as asset from '../utils/asset.cjs'

/**
 * Statuses that the
 * list can take
 *
 * These define what
 * should be rendered
 */
const STATUS = Object.freeze({
  idle: 0,
  list: 1,
  loading: 2,
  error: 3
})

/**
 * The string representation of the "No server"
 * option of the server selector
 *
 * @see components/ServerSelector/index.jsx
 */
const NO_SERVER_ID = '__none'

/**
 * @typedef {{
 *  serverId: String
 * }} Filter
 */
export const Library = () => {
  const [status, setStatus] = React.useState(STATUS.idle)
  const [items, setItems] = React.useState()

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
      setItems([])

      if (!filter.serverId || filter.serverId === NO_SERVER_ID) {
        setStatus(STATUS.idle)
        return
      }

      setStatus(STATUS.loading)

      /*
      Only do a new fetch if
      the server has changed
      */
      if (lastFetchFilterRef.current?.serverId === filter.serverId) {
        return
      }

      try {
        const res = await Promise.all([
          bridge.commands.executeCommand('caspar.sendCommand', filter.serverId, 'cls'),
          bridge.commands.executeCommand('caspar.sendCommand', filter.serverId, 'tls')
        ])

        const parsedMediaAssets = (res?.[0]?.data || [])
          .map(asset.parseMediaAsset)

        const parsedTemplateAssets = (res?.[1]?.data || [])
          .map(asset.parseTemplateAsset)

        const sortedAssets = [...parsedMediaAssets, ...parsedTemplateAssets]
          .sort((a, b) => String(a.name || '').localeCompare(b.name || ''))

        setItems(sortedAssets)
        setStatus(STATUS.list)
      } catch (_) {
        setStatus(STATUS.error)
      }
    }
    exec()
  }, [filter?.serverId, filter?.refresh])

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
    return (items || [])
      .filter(item => {
        return `${item.name || ''}`.toLowerCase()
          .indexOf(query) >= 0
      })
      .map(item => {
        item._filter = filter
        return item
      })
  }, [items, filter])

  return (
    <div className='View--flex'>
      <LibraryHeader onChange={filter => setFilter(filter)} />
      {
        status === STATUS.idle &&
        (
          <div className='View--center'>
            <div className='u-textAlign--center'>
              Select a server<br />
              to load the library
            </div>
          </div>
        )
      }
      {
        status === STATUS.error &&
        <div className='Warning' />
      }
      {
        status === STATUS.loading &&
        <div className='Loader' />
      }
      {
        status === STATUS.list &&
        <LibraryList items={filteredItems} />
      }
    </div>
  )
}
