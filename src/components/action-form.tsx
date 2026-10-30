'use client'

import { useActionState, useEffect } from 'react'
import type { FormState } from '@/app/(main)/actions'
import { Notice } from './page'

type Action = (state: FormState, fd: FormData) => Promise<FormState>

/**
 * A form bound to a server action, with inline error/success text.
 * `confirm` asks before submitting; `onDone` runs after a successful save.
 */
export function ActionForm({
  action,
  hidden,
  confirm,
  onDone,
  className,
  children,
}: {
  action: Action
  hidden?: Record<string, string>
  confirm?: string
  onDone?: () => void
  className?: string
  children: React.ReactNode | ((pending: boolean) => React.ReactNode)
}) {
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (state?.ok) onDone?.()
  }, [state, onDone])

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
    >
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {typeof children === 'function' ? children(pending) : children}
      {state?.error && (
        <div className="mt-3">
          <Notice tone="error">{state.error}</Notice>
        </div>
      )}
    </form>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className ?? 'block'}>
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}
