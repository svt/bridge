import React from 'react'

import { SharedContext } from '../../sharedContext'

import { Notification } from '../Notification'
import { Popover } from '../Popover'

import CollaborationIcon from '../../assets/icons/collaboration.svg'

import * as clipboard from '../../utils/clipboard'

import './style.css'

const HOST = window.APP.address || window.location.hostname
const PORT = window.APP.port
const WORKSPACE_ID = window.APP.workspace

export function Sharing ({ open, onClose = () => {} }) {
  const [shared] = React.useContext(SharedContext)
  const [copied, setCopied] = React.useState(false)

  /*
  Construct a path using the workspace id by default
  but use a more readable name if specified in the
  project settings
  */
  let urlPath = `/workspaces/${WORKSPACE_ID}`
  if (shared?.url) {
    urlPath = `/named/${encodeURIComponent(shared.url)}`
  }

  const url = `http://${HOST}:${PORT}${urlPath}`

  async function handleCopy () {
    await clipboard.copyText(url)
    setCopied(true)
  }

  React.useEffect(() => {
    if (!copied) {
      return
    }

    const id = setTimeout(() => {
      setCopied(false)
    }, 2000)

    return () => {
      if (id) {
        clearTimeout(id)
      }
    }
  }, [copied])

  return (
    <Popover open={open} onClose={onClose}>
      <div className='Sharing u-theme--light'>
        {
          HOST === 'localhost' &&
          (
            <div className='Sharing-notification'>
              <Notification size='small' description='Bridge is only accessible on localhost, change this in settings' />
            </div>
          )
        }
        <div className='Sharing-content'>
          <div className='Sharing-icon' dangerouslySetInnerHTML={{ __html: CollaborationIcon }} />
          Share a link to this workspace and collaborate in real time
          <button className='Button Button--secondary u-width--100pct Sharing-copyBtn' onClick={() => handleCopy()}>
            { copied ? 'Copied' : 'Copy link' }
          </button>
        </div>
      </div>
    </Popover>
  )
}
