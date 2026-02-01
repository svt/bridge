import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { Role } from '../Role'
import { Modal } from '../Modal'
import { AppMenu } from '../AppMenu'
import { Palette } from '../Palette'
import { Sharing } from '../Sharing'
import { Preferences } from '../Preferences'

import { Icon } from '../Icon'

import * as api from '../../api'
import * as windowUtils from '../../utils/window'

import './style.css'

const DEFAULT_TITLE = 'Unnamed'

function handleReload () {
  window.location.reload()
}

export function Footer ({ title = DEFAULT_TITLE, features }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [sharingOpen, setSharingOpen] = React.useState(false)
  const [roleOpen, setRoleOpen] = React.useState(false)

  const connectionCount = Object.keys(shared?._connections || {}).length
  const role = shared?._connections?.[local.id]?.role

  function featureShown (feature) {
    if (!Array.isArray(features)) {
      return true
    }
    return features.includes(feature)
  }

  return (
    <>
      <footer className='Footer' >
        <div className='Footer-block'>
          {
            featureShown('role') &&
            (
              <div className='Footer-actionSection'>
                <button className={`Footer-button Footer-roleBtn ${role === 1 ? 'is-main' : ''}`} onClick={() => setRoleOpen(true)}>
                  {role === 1 ? 'Main' : 'Satellite'}
                </button>
                <Role currentRole={role} open={roleOpen} onClose={() => setRoleOpen(false)} />
              </div>
            )
          }
          {
            featureShown('sharing') &&
            (
              <div className='Footer-actionSection'>
                <button className='Footer-button Footer-sharingBtn' onClick={() => setSharingOpen(true)}>
                  <Icon name='person' />
                  {connectionCount || 0}
                </button>
                <Sharing open={sharingOpen} onClose={() => setSharingOpen(false)} />
              </div>
            )
          }
        </div>
      </footer>
    </>
  )
}
