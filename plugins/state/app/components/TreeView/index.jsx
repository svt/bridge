import React from 'react'
import jsonview from '@pgrabovets/json-view'

import './style.css'

/**
 * @typedef { any } TreeState
 */

/**
 * Get the path for a node as an array
 * of its own and its parents' keys
 * @param { jsonview.Tree } node
 * @returns { String[] }
 */
function getNodePath (node) {
  if (!node?.key) {
    return undefined
  }
  if (!node?.parent) {
    return [node.key]
  }
  return [...getNodePath(node?.parent), node.key]
}

/**
 * Get an object representing the current
 * expanded state for a JSON tree which
 * can later be loaded
 * @param { jsonview.Tree } tree
 * @returns { TreeState }
 */
function getTreeState (tree) {
  const newState = {}
  jsonview.traverse(tree, node => {
    const path = getNodePath(node)
    if (!path) {
      return
    }

    if (!node.isExpanded) {
      return
    }

    let obj = newState
    for (const part of path) {
      if (!obj[part]) {
        obj[part] = {}
      }
      obj = obj[part]
    }
    obj.isExpanded = node.isExpanded
  })
  return newState
}

/**
 * Load the state
 * for a JSON tree
 * @param { jsonview.Tree } tree
 * @param { any } state
 */
function loadTreeState (tree, state) {
  if (!state) {
    return
  }
  jsonview.traverse(tree, node => {
    const path = getNodePath(node)

    /*
     * Go through the state to find the node
     * but return early if it is not expanded
     * to avoid doing unnecessary work
     */
    let nodeState = state
    for (const part of path) {
      if (!nodeState[part] || !nodeState[part].isExpanded) {
        return
      }
      nodeState = nodeState[part]
    }

    if (nodeState?.isExpanded !== node.isExpanded) {
      jsonview.toggleNode(node)
    }
  })
}

export function TreeView ({ data = {} }) {
  const stateRef = React.useRef()
  const treeRef = React.useRef()

  /*
   * Construct a tree view from the provided
   * data, load the currently saved state,
   * and render it to the wrapping element
   */
  React.useEffect(() => {
    if (!treeRef.current) {
      return
    }

    const tree = jsonview.create(JSON.stringify(data))
    jsonview.render(tree, treeRef.current)
    loadTreeState(tree, stateRef.current)

    /*
     * Store the current state so that it can
     * be loaded when the next tree is created,
     * and destroy the current tree
     */
    return () => {
      stateRef.current = getTreeState(tree)
      jsonview.destroy(tree)
    }
  }, [data])

  return (
    <div className='TreeView'>
      <div ref={treeRef} className='TreeView-tree' />
    </div>
  )
}