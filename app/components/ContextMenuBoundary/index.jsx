import React from 'react'
import * as api from '../../api'

import { ContextMenu } from '../ContextMenu'
import { ContextMenuItem } from '../ContextMenuItem'
import { ContextMenuDivider } from '../ContextMenuDivider'

const TYPES = {
  item: ContextMenuItem,
  divider: ContextMenuDivider
}

const ALLOWED_SPEC_PROPERTIES = [
  'type',
  'label'
]

function isNumber (x) {
  return typeof x === 'number' && !Number.isNaN(x)
}

function getScreenCoordinates () {
  return {
    x: window.screenLeft,
    y: window.screenTop
  }
}

function convertToPageCoordinates (ctxX, ctxY, screenX, screenY) {
  return {
    x: ctxX - screenX,
    y: ctxY - screenY
  }
}

function sanitizeItemSpec (spec) {
  const out = {}
  for (const property of ALLOWED_SPEC_PROPERTIES) {
    out[property] = spec[property]
  }
  return out
}

function renderItemSpec (spec, key) {
  if (!TYPES[spec?.type]) {
    return <></>
  }

  const Component = TYPES[spec.type]

  function handleClick () {
    if (typeof spec?.onClick !== 'function') {
      return
    }
    spec.onClick()
  }

  return (
    <Component key={key} {...sanitizeItemSpec(spec)} text={spec?.label} onClick={() => handleClick()}>
      {
        (spec?.children || [])
          .map((child, i) => renderItemSpec(child, i))
      }
    </Component>
  )
}

export function ContextMenuBoundary ({ children }) {
  const [contextPos, setContextPos] = React.useState()
  const [spec, setSpec] = React.useState()

  React.useEffect(() => {
    let bridge
  
    function onRequestContextMenu (opts, spec) {
      if (!isNumber(opts?.x) || !isNumber(opts?.y)) {
        console.warn('Missing context menu position')
        return
      }

      if (!Array.isArray(spec)) {
        console.warn('Invalid context spec')
        return
      }

      const screenCoords = getScreenCoordinates()
      const pageCoords = convertToPageCoordinates(opts.x, opts.y, screenCoords.x, screenCoords.y)

      setContextPos({
        x: Math.max(pageCoords.x, 0),
        y: Math.max(pageCoords.y, 0)
      })

      setSpec(spec)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('ui.contextMenu', onRequestContextMenu)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('ui.contextMenu', onRequestContextMenu)
    }
  }, [])

  function handleClose () {
    setContextPos(undefined)
    setSpec(undefined)
  }

  return (
    <>
      {
        contextPos &&
        (
          <ContextMenu x={contextPos.x} y={contextPos.y} onClose={() => handleClose()}>
            {
              Array.isArray(spec)
                ? spec.map((item, i) => renderItemSpec(item, `spec_${i}`))
                : renderItemSpec(spec)
            }
          </ContextMenu>
        )
      }
      {children}
    </>
  )
}