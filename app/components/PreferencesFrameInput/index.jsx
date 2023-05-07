import React from 'react'
import './style.css'

import { Frame } from '../Frame'

import * as api from '../../api'

export function PreferencesFrameInput ({ label, uri }) {
  const [bridge, setBridge] = React.useState()

  React.useEffect(() => {
    async function setup () {
      setBridge(await api.load())
    }
    setup()
  }, [])

  return (
    <div className='PreferencesFrameInput'>
      {
        bridge && <Frame src={uri} api={bridge} />
      }
    </div>
  )
}
