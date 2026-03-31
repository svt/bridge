import React from 'react'
import bridge from 'bridge'

import { LibraryHeader } from '../LibraryHeader'
import { LibraryList } from '../LibraryList'

import * as asset from '../../utils/asset'
import * as filterUtils from '../../utils/filter'

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
export const Library = ({ highlightItem, serverId, onItemClick, onItemDoubleClick }) => {
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

  /*
  Set the server id passed as
  a prop as a filter if provided
  */
  React.useEffect(() => {
    setFilter(current => {
      return {
        ...current,
        serverId: serverId
      }
    })
  }, [serverId])

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

      const typeStr = filter?.type || filterUtils.DEFAULT_TYPES_STR

      try {
        const commands = []

        if (filterUtils.typeIncludesMedia(typeStr)) {
          commands.push(
            bridge.commands.executeCommand('caspar.sendCommand', filter.serverId, 'cls')
              .then(res => {
                return (res?.data || [])
                  .map(asset.parseMediaAsset)
              })
          )
        }

        if (filterUtils.typeIncludesTemplate(typeStr)) {
          commands.push(
            bridge.commands.executeCommand('caspar.sendCommand', filter.serverId, 'tls')
              .then(res => {
                return (res?.data || [])
                  .map(asset.parseTemplateAsset)
              })
          )
        }

        const res = await Promise.all(commands)
        const sortedAssets = res
          .flat()
          .filter(item => item)
          .sort((a, b) => String(a.name || '').localeCompare(b.name || ''))
          .filter(item => filterUtils.filterByItemType(item?.type, typeStr))

        setItems(sortedAssets)
        setStatus(STATUS.list)
      } catch (err) {
        console.error('[Caspar Library] Error', err)
        setStatus(STATUS.error)
      }
    }
    exec()
  }, [filter?.serverId, filter?.refresh, filter?.type])

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
      <LibraryHeader filter={filter} onChange={filter => setFilter(filter)} />
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
        <LibraryList
          items={filteredItems}
          highlightItem={highlightItem}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
        />
      }
    </div>
  )
}
