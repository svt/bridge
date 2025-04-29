import React from "react"
import { ThemeProvider } from "styled-components"

import { LibraryListItem } from "../LibraryListItem"
import { LibraryListFolder } from "../LibraryListFolder"
import { buildFolderTree } from "../../utils/library"

import "./style.css"

export const LibraryList = ({ items, onNodeClick }) => {
  const folderizedItems = buildFolderTree(items)
  return (
    <ThemeProvider theme={{ indent: 10 }}>
      <div className="LibraryList">
        <FolderRecursive data={folderizedItems} parentNode={folderizedItems} />
      </div>
    </ThemeProvider>
  )
}

const FolderRecursive = ({ data, parentNode }) => {
  return data.map((item) => {
    if (item.file === true) {
      return <LibraryListItem key={item.id} item={item} className="LibraryListItem" />
    }
    if (item.file === false) {
      return (
        <LibraryListFolder
          key={item.id}
          id={item.id}
          name={item.name}
          node={item}
        >
          <FolderRecursive data={item.files} parentNode={item} />
        </LibraryListFolder>
      )
    }
  })
}
