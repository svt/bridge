import React from 'react'
import './style.css'

export const ModalFooter = ({ numItemsSelected = 0, onModalClose = () => {} }) => {
  return (
    <footer className='ModalFooter'>
      <div className='ModalFooter-section'>
        Editing {numItemsSelected}
        {
          numItemsSelected === 1
          ? ' item'
          : ' items'
        }
      </div>
      <div className='ModalFooter-section'>
        <button className='Button--ghost' onClick={() => onModalClose()}>
          Cancel
        </button>
      </div>
    </footer>
  )
}