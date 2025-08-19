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
    applyShared({
      children: data
    })
  }

  return (
    <>
      <Header features={['reload', 'palette', 'role']} />
      <div className='View-component'>
        {
          widgetExists(widget?.component, repository)
            ? <WidgetRenderer data={widget} onUpdate={data => handleComponentUpdate({ [id]: data })} forwardProps={{ enableFloat: false }} />
            : <MissingComponent data={widget} />
        }
      </div>
    </>
  )
}
