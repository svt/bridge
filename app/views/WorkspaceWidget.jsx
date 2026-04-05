/**
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  id: String?,
 *  component: String
 * }} ComponentData
 */

import React from 'react'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { SharedContext } from '../sharedContext'
import { MissingComponent } from '../components/MissingComponent'

import { WidgetRenderer, widgetExists } from '../components/WidgetRenderer'

/**
 * The widget id for
 * the current widget
 * @type { String }
 */
const widgetId = window.APP.widget

function findWidget (root, id) {
  if (!id) {
    return
  }

  const children = root?.children || {}
  if (children[id]) {
    return children[id]
  }

  for (const child of Object.values(children)) {
    const ret = findWidget(child, id)
    if (ret) {
      return ret
    }
  }
}

/**
 * Find the path of keys from a root node down
 * to a component with the given id, where each
 * level is keyed by the component's id.
 * Returns an array of keys, or null if not found.
 * @param { any } root
 * @param { String } id
 * @param { String[] } path
 * @returns { String[] | null }
 */
function findWidgetPath (root, id, path = []) {
  if (!id) return null
  const children = root?.children || {}
  for (const [key, child] of Object.entries(children)) {
    if (key === id) {
      return [...path, key]
    }
    const result = findWidgetPath(child, id, [...path, key])
    if (result) return result
  }
  return null
}

/**
 * Build a nested children update object from a path array.
 * e.g. ['a', 'b', 'c'] + data → { a: { children: { b: { children: { c: data } } } } }
 * @param { String[] } path
 * @param { any } data
 * @returns { any }
 */
function buildChildrenUpdate (path, data) {
  if (path.length === 1) {
    return { [path[0]]: data }
  }
  return { [path[0]]: { children: buildChildrenUpdate(path.slice(1), data) } }
}

function getWidgetId () {
  return widgetId
}

export const WorkspaceWidget = () => {
  const [shared, applyShared] = React.useContext(SharedContext)

  const [repository, setRepository] = React.useState({})
  const [widget, setWidget] = React.useState()

  React.useEffect(() => {
    const id = getWidgetId()
    const widget = findWidget({ children: shared.children }, id)
    setWidget(widget)
  }, [shared.children, window.location.search])

  React.useEffect(() => {
    setRepository(shared._widgets)
  }, [shared._widgets])

  /**
   * Handle updates of component data
   * by applying the data to the shared
   * state, updating the layout for all
   * connected clients
   * @param { Object } data
   */
  function handleComponentUpdate (data) {
    const path = findWidgetPath({ children: shared.children }, widgetId)
    if (!path) {
      return
    }

    console.log('Update', buildChildrenUpdate(path, data))
    applyShared({ children: buildChildrenUpdate(path, data) })
  }

  return (
    <>
      <Header features={['stayOnTop', 'reload', 'palette']} />
      <div className='View-component'>
        <WidgetRenderer widgetId={widgetId} widgets={repository} data={widget} onUpdate={handleComponentUpdate} forwardProps={{ isFloated: true, enableFloat: false }} />
      </div>
      <Footer features={['role']} />
    </>
  )
}
