/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

import React from 'react'

export function useJson (url) {
  const [data, setData] = React.useState({})

  React.useEffect(() => {
    async function get (url) {
      const res = await window.fetch(url)
        .then(res => res.json())
      setData(res)
    }
    get(url)

    return () => setData({})
  }, [url])

  return [data]
}
