import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'

import { Monaco } from '../components/Monaco'

export const InspectorTemplate = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  const [value, setValue] = React.useState()

  const selectionRef = React.useRef([])

  React.useEffect(() => {
    const selection = bridge.client.getSelection()
    selectionRef.current = selection
    setSelection(selection)
  }, [state])

  /*
  Update the value-state only when the selection
  changes to not interfere with writing in the editor
  */
  React.useEffect(() => {
    const items = selection.map(id => state?.items?.[id])
    const value = items?.[0]?.data?.caspar?.templateData
    setValue(value)
  }, [selection])

  function handleNewValue (set) {
    for (const id of selectionRef.current) {
      bridge.items.applyItem(id, set)
    }
  }

  function handleChange(newValue) {
    handleNewValue({
      data: {
        caspar: {
          templateData: JSON.parse(newValue)
        }
      }
    })
  }

  return (
    <div className='View--spread'>
      <Monaco
        value={value ? JSON.stringify(value, null, 2) : ['{', '\t"f0": "my value"', '}'].join('\n')}
        onChange={newValue => handleChange(newValue)}
      />
    </div>
  )
}
