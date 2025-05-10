import React, { useState } from "react"

import { Icon } from '../Icon'
import "./style.css"

const LibraryListFolderName = ({ isOpen, name, handleClick }) => {
  return (
    <div
      className={`LibraryListFolder-name ${isOpen ? 'is-open' : ''}`}
      onClick={handleClick}
    >
      <div className='LibraryListFolder-nameIcon'>
        <Icon name='arrow-down' />
      </div>
      <div className="LibraryListFolder-nameText">
        {name}
      </div>
    </div>    
  )
}

const LibraryListFolder = ({ name, children, node }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className={`LibraryListFolder ${isOpen ? 'is-open' : 'is-closed'}`}>
      <div className='LibraryListFolder-header'>
        <LibraryListFolderName
          name={name}
          isOpen={isOpen}
          handleClick={() => setIsOpen(!isOpen)}
        />
        <div className="LibraryListFolder-items">{node?.files?.length ?? 0} items</div>
      </div>
      <div className="LibraryListFolder-folder">
        <div className="LibraryListFolder-line">
          {children}
        </div>
      </div>
    </section>
  )
}

export { LibraryListFolder }
