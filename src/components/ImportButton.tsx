/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react'

export default function ImportButton() {
  const handleImport = async (e: any) => {
    e.preventDefault()
    const res = await fetch('/api/natural-diamonds/imports-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    console.log(data)
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* <input
        type="file"
        accept=".csv"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={handleImport}
      /> */}
      <button onClick={handleImport}>📥 Import Products</button>
    </div>
  )
}
