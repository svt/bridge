import React from 'react'

import { Grid } from '../Grid'
import { GridItem } from '../GridItem'

import { TabsComponent } from '../TabsComponent'
import { EmptyComponent } from '../EmptyComponent'
import { FrameComponent } from '../FrameComponent'
import { MissingComponent } from '../MissingComponent'

/**
 * Define render functions for the
 * internal components such as
 * basic layouts
 */
const INTERNAL_COMPONENTS = {
  'bridge.internals.grid': (widgetId, data, onUpdate, widgets) => {
    return (
      <Grid widgetId={widgetId} data={data} onChange={onUpdate}>
        {
          (data.children ? Object.entries(data.children) : [])
            .map(([id, component]) => {
              return (
                <GridItem key={id}>
                  <WidgetRenderer
                    widgetId={id}
                    data={component}
                    widgets={widgets}
                    onUpdate={data => onUpdate({
                      children: {
                        [id]: data
                      }
                    })}
                  />
                </GridItem>
              )
            })
        }
      </Grid>
    )
  },
  'bridge.internals.tabs': (widgetId, data, onUpdate, widgets) => {
    return <TabsComponent widgetId={widgetId} data={data} widgets={widgets} onUpdate={onUpdate} />
  },
  'bridge.internals.empty': () => {
    return <EmptyComponent />
  }
}

export function widgetExists (component, widgets = {}) {
  if (INTERNAL_COMPONENTS[component]) {
    return true
  }

  if (widgets?.[component]) {
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
export const WidgetRenderer = ({ widgetId, widgets, data, onUpdate = () => {}, forwardProps = {} }) => {
  if (INTERNAL_COMPONENTS[data?.component]) {
    return INTERNAL_COMPONENTS[data.component](widgetId, data, onUpdate, widgets)
  }
  
  if (!widgets || typeof widgets != 'object') {
    return <></>
  }
  
  const uri = widgets?.[data?.component]?.uri
  if (!uri) {
    return <MissingComponent widgetId={widgetId} data={data} />
  }

  return <FrameComponent widgetId={widgetId} uri={uri} widgets={widgets} data={data} onUpdate={onUpdate} {...forwardProps} />
}
