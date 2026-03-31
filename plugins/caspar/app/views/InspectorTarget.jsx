import React from 'react'
import bridge from 'bridge'

export const InspectorTarget = () => {
  async function handleButtonClick () {
    const modalId = bridge.ui.modal.makeId()
    bridge.ui.modal.open({
      id: modalId,
      uri: `${window.location.origin}${window.location.pathname}?path=library/modal&modalId=${modalId}`
    })
  }

  return (
    <>
      <div className='View--spread u-marginBottom--5px'>
        <button className='Button u-width--100pct' onClick={() => handleButtonClick()}>
          Browse files
        </button>
      </div>
    </>
  )
}
