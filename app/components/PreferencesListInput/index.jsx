import React from 'react'
import './style.css'

import * as uuid from 'uuid'

import { Preference } from '../Preferences/preference'

function PreferencesListInputItem ({ value = {}, settings = [], onChange = () => {}, onDelete = () => {} }) {
  function handleChange (key, newValue) {
    onChange({
      ...value,
      [key]: newValue
    })
  }

  function handleDelete () {
    onDelete()
  }

  return (
    <div className='PreferencesListInputItem'>
      <div className='PreferencesListInputItem-flexWrapper'>
        <div>
          {
            (Array.isArray(settings) ? settings : [])
              .map((setting, i) => {
                return (
                  <div key={i} className='PreferencesListInputItem-input'>
                    <Preference
                      values={value}
                      setting={setting}
                      onChange={handleChange}
                    />
                  </div>
                )
              })
          }
        </div>
        <div className='PreferencesListInputItem-actions'>
          <button className='Button Button--ghost' onClick={() => handleDelete()}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export function PreferencesListInput ({ label, value = [], settings = [], onChange = () => {}, buttonTextCreate = 'New' }) {
  const items = Array.isArray(value) ? value : []

  function handleCreate () {
    const id = uuid.v4()
    const newItem = {
      id
    }
    onChange({ $replace: [...items, newItem] })
  }

  function handleUpdate (id, newData) {
    const index = items.findIndex(item => item.id === id)
    if (index === -1) {
      return
    }

    const newItems = [...items]
    newItems[index] = newData
    onChange({ $replace: newItems })
  }

  function handleDelete (id) {
    const index = items.findIndex(item => item.id === id)
    if (index === -1) {
      return
    }

    const newItems = [...items]
    newItems.splice(index, 1)
    onChange({ $replace: newItems })
  }

  return (
    <div className='PreferencesListInput'>
      <div className='PreferencesListInput-header'>
        <button className='Button Button--ghost' onClick={() => handleCreate()}>
          { buttonTextCreate }
        </button>
      </div>
      <div className='PreferencesListInput-items'>
        {
          items.map(item => {
            return (
              <div key={item.id} className='PreferencesListInput-item'>
                <PreferencesListInputItem
                  value={item}
                  settings={settings}
                  onChange={newData => handleUpdate(item.id, newData)}
                  onDelete={() => handleDelete(item.id)}
                />
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
