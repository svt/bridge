import React, { useState } from "react"

import { Icon } from '../Icon'
import "./style.css"

import { toLowerCaseExceptFirst } from "../../utils/library"

const FolderName = ({ isOpen, name, handleClick }) => {
  const formattedName = toLowerCaseExceptFirst(name)

  return (
    <div className={`FolderName ${isOpen ? 'is-open' : ''}`} onClick={handleClick}>
      <div className='FolderName-icon'>
        <Icon name='arrow-down' />
      </div>
      <div className="FolderName-text">
        {formattedName}
      </div>
    </div>    
  )
}

const LibraryListFolder = ({ name, children, node }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className={'FolderWrapper'}>
      <div className={'FolderHeader'}>
        <FolderName
          name={name}
          isOpen={isOpen}
          handleClick={() => setIsOpen(!isOpen)}
        />
        <div className="FolderItems">{node?.files?.length ?? 0} items</div>
      </div>
      <div className={`CollapsibleFolder ${isOpen ? 'open' : 'closed'}`}>
        <div className="VerticalLine">
          {children}
        </div>
      </div>
    </section>
  )
}

export { LibraryListFolder }
