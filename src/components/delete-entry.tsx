'use client'

import { useActionState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteEntry } from '@/app/(main)/actions'

export function DeleteEntryButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteEntry, null)

  return (
    <form
      action={action}
      className="no-print -mr-2 shrink-0"
      onSubmit={(e) => {
        if (!window.confirm('Remove this entry? The stock count will be put back.')) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        aria-label="Remove entry"
        title={state?.error ?? 'Remove entry'}
        className="rounded-md p-2 text-ink-faint transition-colors hover:bg-khata-wash hover:text-khata disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
      {state?.error && (
        <p role="alert" className="max-w-40 text-right text-xs text-khata">
          {state.error}
        </p>
      )}
    </form>
  )
}
