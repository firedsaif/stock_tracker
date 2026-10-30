'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-quiet btn-sm no-print" aria-label="Print">
      <Printer className="size-4" /> <span className="hidden sm:inline">Print</span>
    </button>
  )
}
