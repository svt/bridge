import React from 'react'

import { Notification } from '../Notification'
import { Popover } from '../Popover'

import CollaborationIcon from '../../assets/icons/collaboration.svg'

import * as clipboard from '../../utils/clipboard'

import './style.css'

const HOST = window.APP.address || window.location.hostname
const PORT = window.APP.port
const WORKSPACE = window.APP.workspace

export function Sharing ({ open, onClose = () => {} }) {
  const [copied, setCopied] = React.useState(false)

  const url = `http://${HOST}:${PORT}/workspaces/${WORKSPACE}`

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
          <Notification size='small' description='Bridge is only accessible on localhost, change this in settings' />
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
