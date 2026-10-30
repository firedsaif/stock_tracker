'use client'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const missingSetup = /people|record_movement|person_id/i.test(error.message)

  return (
    <div className="ledger mx-4 px-5 py-8 sm:mx-0">
      <h1 className="font-condensed text-2xl font-semibold">This page didn’t load</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {missingSetup
          ? 'The database is missing the People setup. Run the migration in supabase/migrations in the Supabase SQL editor, then try again.'
          : error.message || 'Check your connection and try again.'}
      </p>
      <button onClick={reset} className="btn-ink mt-5">
        Try again
      </button>
    </div>
  )
}
