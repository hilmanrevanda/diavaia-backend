'use client'

import React, { useRef } from 'react'

export default function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()

    const rows = text
      .split('\n')
      .map((row) => row.split(','))
      .filter((r) => r.length > 1)

    const headers = rows[0]
    const products = rows
      .slice(1)
      .map((cols) => Object.fromEntries(cols.map((val, i) => [headers[i], val])))

    console.log(products)

    // const res = await fetch('/api/products/import-csv', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ products }),
    // })

    // const result = await res.json()
    // alert(result.message)
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <button onClick={() => inputRef.current?.click()}>📥 Import Products</button>
    </div>
  )
}
