import React from 'react'

import { Grid } from '../Grid'
import { GridItem } from '../GridItem'

import { TabsComponent } from '../TabsComponent'
import { EmptyComponent } from '../EmptyComponent'
import { FrameComponent } from '../FrameComponent'

/**
 * Define render functions for the
 * internal components such as
 * basic layouts
 */
const INTERNAL_COMPONENTS = {
  'bridge.internals.grid': (data, onUpdate) => {
    return (
      <Grid data={data} onChange={onUpdate}>
        {
          (data.children ? Object.entries(data.children) : [])
            .map(([id, component]) => (
              <GridItem key={id}>
                <WidgetRenderer
                  data={{ id, ...component }}
                  onUpdate={data => onUpdate({
                    children: {
                      [id]: data
                    }
                  })}
                />
              </GridItem>
            ))
        }
      </Grid>
    )
  },
  'bridge.internals.tabs': (data, onUpdate) => {
    return <TabsComponent data={data} onUpdate={onUpdate} />
  },
  'bridge.internals.empty': () => {
    return <EmptyComponent />
  }
}

export function widgetExists (component, repository = {}) {
  if (INTERNAL_COMPONENTS[component]) {
    return true
  }

  if (repository?.[component]) {
    return true
  }

  return false
}

/**
 * A helper function for rendering
 * a widget from its manifest
 * data from the store
 * @param { String } id
 * @param { ComponentData } data
 * @param { (arg1: any) => {} } onUpdate
 * @returns { React.ReactElement }
 */
export const WidgetRenderer = ({ data, onUpdate = () => {}, forwardProps = {} }) => {
  if (INTERNAL_COMPONENTS[data.component]) {
    return INTERNAL_COMPONENTS[data.component](data, onUpdate)
  }
  return <FrameComponent data={data} onUpdate={onUpdate} {...forwardProps} />
}
