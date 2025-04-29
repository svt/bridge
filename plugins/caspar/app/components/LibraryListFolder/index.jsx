import React, { useState } from "react"
import styled from "styled-components"
import { IoIosArrowForward } from "react-icons/io"

import "./style.css"

import { Collapsible } from '../Collapsible'
import { toLowerCaseExceptFirst } from "../../utils/library"

const FolderName = ({ isOpen, name, handleClick }) => {
  const formattedName = toLowerCaseExceptFirst(name)

  return (
    <div onClick={handleClick} className="FolderName">
      <IoIosArrowForward className={`FolderIcon ${isOpen ? 'open' : ''}`} />
      &nbsp;{formattedName}
    </div>
  );
}

const LibraryListFolder = ({ id, name, children, node }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <StyledFolder key={id}>
      <div className="FolderHeader">
        <FolderName
          name={name}
          isOpen={isOpen}
          handleClick={() => setIsOpen(!isOpen)}
        />
        <div className="FolderItems">{node?.files?.length} items</div>
      </div>
      <Collapsible isOpen={isOpen}>
        <div className="VerticalLine">
          {children}
        </div>
      </Collapsible>
    </StyledFolder>
  )
}

export { LibraryListFolder }

const StyledFolder = styled.section`
  font-weight: normal;
  padding-left: ${(p) => p.theme.indent}px;
  .tree__file {
    padding-left: ${(p) => p.theme.indent}px;
  }
`
