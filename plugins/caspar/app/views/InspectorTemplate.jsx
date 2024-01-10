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
    async function updateSelection () {
      const selection = await bridge.client.getSelection()
      selectionRef.current = selection
      setSelection(selection)
    }
    updateSelection()
  }, [state])

  /*
  Update the value-state only when the selection
  changes to not interfere with writing in the editor
  */
  React.useEffect(() => {
    const items = selection.map(id => state?.items?.[id])
    const value = items?.[0]?.data?.caspar?.templateDataString
    setValue(value)
  }, [JSON.stringify(selection)])

  function handleNewValue (set) {
    for (const id of selectionRef.current) {
      bridge.items.applyItem(id, set)
    }
  }

  function handleChange(newValue) {
    handleNewValue({
      data: {
        caspar: {
          templateData: JSON.parse(newValue),
          templateDataString: newValue
        }
      }
    })
  }

  return (
    <div className='View--spread'>
      <Monaco
        value={value ?? ['{', '', '}'].join('\n')}
        onChange={newValue => handleChange(newValue)}
      />
    </div>
  )
}
