import React from 'react'
import * as api from '../../api'

import { ContextMenu } from '../ContextMenu'
import { ContextMenuItem } from '../ContextMenuItem'
import { ContextMenuDivider } from '../ContextMenuDivider'
import { ContextMenuSearchItem } from '../ContextSearchItem'

const TYPES = {
  item: ContextMenuItem,
  divider: ContextMenuDivider
}

const ALLOWED_SPEC_PROPERTIES = [
  'type',
  'label'
]

const MENU_WIDTH_IF_SEARCH_PX = 250

function isNumber (x) {
  return typeof x === 'number' && !Number.isNaN(x)
}

function sanitizeItemSpec (spec) {
  const out = {}
  for (const property of ALLOWED_SPEC_PROPERTIES) {
    out[property] = spec[property]
  }
  return out
}

function renderItemSpec (spec, key, onClose = () => {}) {
  if (!TYPES[spec?.type]) {
    return <></>
  }

  const Component = TYPES[spec.type]

  function handleClick () {
    if (typeof spec?.onClick !== 'function') {
      return
    }
    spec.onClick()
    onClose()
  }

  return (
    <Component key={key} {...sanitizeItemSpec(spec)} text={spec?.label} onClick={() => handleClick()}>
      {
        (spec?.children || [])
          .map((child, i) => renderItemSpec(child, `${key}_${i}`, onClose))
      }
    </Component>
  )
}

export function ContextMenuBoundary ({ children }) {
  const [contextPos, setContextPos] = React.useState()

  const [originalSpec, setOriginalSpec] = React.useState()
  const [renderedSpec, setRenderedSpec] = React.useState()
  const [opts, setOpts] = React.useState()

  React.useEffect(() => {
    let bridge
  
    function onRequestContextMenu (spec, opts) {
      if (!isNumber(opts?.x) || !isNumber(opts?.y)) {
        console.warn('Missing context menu position')
        return
      }

      if (!Array.isArray(spec)) {
        console.warn('Invalid context spec')
        return
      }

      setContextPos({
        x: Math.max(opts.x, 0),
        y: Math.max(opts.y, 0)
      })

      setOpts(opts)
      setRenderedSpec(spec)
      setOriginalSpec(spec)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('ui.contextMenu.open', onRequestContextMenu)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('ui.contextMenu.open', onRequestContextMenu)
    }
  }, [])

  React.useEffect(() => {
    let bridge
  
    function onContextMenuClose () {
      setContextPos(undefined)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('ui.contextMenu.close', onContextMenuClose)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('ui.contextMenu.close', onContextMenuClose)
    }
  }, [])

  function handleClose () {
    setContextPos(undefined)

    setOriginalSpec(undefined)
    setRenderedSpec(undefined)
  }

  function handleSearch (newSpec) {
    setRenderedSpec(newSpec)
  }

  return (
    <>
      {
        contextPos &&
        (
          <ContextMenu
            x={contextPos.x}
            y={contextPos.y}
            width={opts?.searchable && MENU_WIDTH_IF_SEARCH_PX}
            onClose={() => handleClose()}
          >
            {
              opts?.searchable &&
              <ContextMenuSearchItem spec={originalSpec} onSearch={newSpec => handleSearch(newSpec)} />
            }
            {
              Array.isArray(renderedSpec)
                ? renderedSpec.map((item, i) => renderItemSpec(item, `contextMenu_${i}`, handleClose))
                : renderItemSpec(renderedSpec, 'contextMenu', handleClose)
            }
          </ContextMenu>
        )
      }
      {children}
    </>
  )
}