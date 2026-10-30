'use client'

import { useActionState } from 'react'
import { login } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <form action={action} className="ledger space-y-4 px-5 py-6 sm:px-6">
      <label className="block">
        <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft">Email</span>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-md bg-khata-wash px-3 py-2.5 text-sm text-khata">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? 'Opening…' : 'Open my khata'}
      </button>
    </form>
  )
}
