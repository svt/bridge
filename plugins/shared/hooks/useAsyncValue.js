// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

import React from 'react'

export function useAsyncValue (provider = () => {}, dependencies = []) {
  const [value, setValue] = React.useState()

  React.useEffect(() => {
    async function get () {
      const newValue = await provider()
      setValue(newValue)
    }
    get()
  }, [provider, ...dependencies])

  return [value]
}
