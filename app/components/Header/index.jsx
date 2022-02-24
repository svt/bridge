{/*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/}

import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { Modal } from '../Modal'
import { Preferences } from '../Preferences'

import { Icon } from '../Icon'

import './style.css'

export function Header ({ title = 'Bridge' }) {
  const [shared,, applySharedKey] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [prefsOpen, setPrefsOpen] = React.useState(false)
  const [titleStr, setTitleStr] = React.useState(title)

  const connections = shared?.connections?.length

  /**
   * Set the `isEditingLayout` toggle on
   * this client's object in the shared state
   * @param { Boolean } isEditing
   */
  function handleEdit (isEditing) {
    applySharedKey(local.id, {
      isEditingLayout: isEditing
    })
  }

  /*
  Update the title to indicate that
  we're currently editing the layout
  when the toggle changes
  */
  React.useEffect(() => {
    const isEditing = shared[local.id]?.isEditingLayout
    if (isEditing) {
      setTitleStr('Editing layout')
      return
    }
    setTitleStr(title)
  }, [title, shared[local.id]?.isEditingLayout])

  return (
    <>
      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)}>
        <Preferences onClose={() => setPrefsOpen(false)} />
      </Modal>
      <header className='Header'>
        <div />
        <div className='Header-center'>
          {titleStr}
        </div>
        <div className='Header-block'>
          <div className='Header-connections'>
            <div className='Header-connectionsIcon'>
              <Icon name='person' />
            </div>
            {connections || 0}
          </div>
          <button className='Header-button Header-editBtn' onClick={() => handleEdit(!shared[local.id]?.isEditingLayout)}>
            <Icon name='edit' />
          </button>
          <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)}>
            <Icon name='preferences' />
          </button>
        </div>
      </header>
    </>
  )
}
