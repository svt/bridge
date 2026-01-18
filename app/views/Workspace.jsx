/**
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  id: String?,
 *  component: String
 * }} ComponentData
 */

import React from 'react'

import { SharedContext } from '../sharedContext'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Onboarding } from '../components/Onboarding'

import { WidgetRenderer } from '../components/WidgetRenderer'
import { MessageContainer } from '../components/MessageContainer'

/**
 * Get the file name without extension
 * from a file path
 * @param { String } filePath
 * @returns { String }
 */
function getFileNameFromPath (filePath) {
  if (typeof filePath !== 'string') {
    return undefined
  }

  return filePath
    /*
    Remove everything but
    the last part of the path
    */
    .replace(/^.*[\\\/]/, '') // eslint-disable-line

    /*
    Remove .extension from
    the file name
    */
    .replace(/(\.(.[^\.])+){1}$/, '') // eslint-disable-line
}

export const Workspace = () => {
  const [shared, applyShared] = React.useContext(SharedContext)
  const sharedRef = React.useRef(shared)

  React.useEffect(() => {
    sharedRef.current = shared
  }, [shared])

  const children = React.useMemo(() => {
    if (!shared?.children) {
      return []
    }
    return Object.entries(shared.children)
  }, [JSON.stringify(shared.children)])

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
      <Onboarding />
      <Header title={getFileNameFromPath(shared._filePath)} />
      {
        /*
        Render the message container unless
        the 'hide messages' setting is set
        to true
        */
        !shared?._userDefaults?.hideMessages &&
        <MessageContainer />
      }
      {
        /*
        Loop through the components from the store
        and render them all in the interface
        */
        children
          .map(([id, component]) => (
            <div key={id} className='View-component'>
              <WidgetRenderer widgetId={id} widgets={sharedRef.current?._widgets} data={component} onUpdate={data => handleComponentUpdate({ [id]: data })} />
            </div>
          ))
      }
      <Footer />
    </>
  )
}
