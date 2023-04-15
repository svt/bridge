// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import React from 'react'

export const useJson = url => {
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
