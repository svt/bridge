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

import { Grid } from '../components/Grid'
import { GridItem } from '../components/GridItem'

import { TabsComponent } from '../components/TabsComponent'
import { FrameComponent } from '../components/FrameComponent'
import { MissingComponent } from '../components/MissingComponent'
import { SelectionComponent } from '../components/SelectionComponent'

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
  const [shared,, applySharedKey] = React.useContext(SharedContext)
  const sharedRef = React.useRef(shared)

  React.useEffect(() => {
    sharedRef.current = shared
  }, [shared])

  /**
   * Define render functions for the
   * internal components such as
   * basic layouts
   */
  const INTERNAL_COMPONENTS = React.useRef({
    'bridge.internals.grid': (data, onUpdate) => {
      return (
        <Grid data={data} onChange={onUpdate}>
          {
            (data.children ? Object.entries(data.children) : [])
              .map(([id, component]) => (
                <GridItem key={id}>
                  {
                    renderComponent({ id, ...component }, data => onUpdate({
                      children: {
                        [id]: data
                      }
                    }))
                  }
                </GridItem>
              ))
          }
        </Grid>
      )
    },
    'bridge.internals.tabs': (data, onUpdate) => {
      return <TabsComponent data={data} onUpdate={onUpdate} renderComponent={renderComponent} />
    },
    'bridge.internals.selection': (_, onUpdate) => {
      return <SelectionComponent onChange={onUpdate} />
    }
  })

  /**
   * A helper function for rendering
   * a component from its manifest
   * data from the store
   * @param { String } id
   * @param { ComponentData } data
   * @param { (arg1: any) => {} } onUpdate
   * @returns { React.ReactElement }
   */
  function renderComponent (data, onUpdate) {
    if (INTERNAL_COMPONENTS.current[data.component]) {
      return INTERNAL_COMPONENTS.current[data.component](data, onUpdate)
    }

    if (sharedRef.current?._widgets?.[data.component]) {
      return <FrameComponent data={data} onUpdate={onUpdate} />
    }

    return <MissingComponent data={data} />
  }

  /**
   * Handle updates of component data
   * by applying the data to the shared
   * state, updating the layout for all
   * connected clients
   * @param { Object } data
   */
  function handleComponentUpdate (data) {
    applySharedKey('children', data)
  }

  return (
    <>
      <Header title={getFileNameFromPath(shared._filePath)} />
      {
        /*
        Loop through the components from the store
        and render them all in the interface
        */
        (shared.children ? Object.entries(shared.children) : [])
          .map(([id, component]) => renderComponent(
            component,
            data => handleComponentUpdate({ [id]: data })
          ))
      }
    </>
  )
}
