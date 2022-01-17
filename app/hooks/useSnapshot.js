/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

import React from 'react'

export function useSnapshot (data) {
  const snapshotRef = React.useRef()
  const [out, setOut] = React.useState(true)

  React.useEffect(() => {
    const newSnapshot = JSON.stringify(data)
    if (newSnapshot === snapshotRef.current) {
      setOut(false)
      return
    }

    snapshotRef.current = newSnapshot
    setOut(true)
  }, [data])

  return out
}
