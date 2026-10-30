import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <p className="font-condensed text-2xl font-semibold">Nothing on this page</p>
        <p className="mt-2 text-sm text-ink-soft">It may have been removed.</p>
        <Link href="/" className="btn-ink mt-5">
          Back to this month
        </Link>
      </div>
    </main>
  )
}
