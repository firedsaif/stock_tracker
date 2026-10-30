export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-7 px-4 sm:px-0">
        <div className="h-9 w-56 rounded bg-rule" />
      </div>
      <ul className="ledger">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="ledger-row">
            <div className="ledger-margin">
              <div className="h-6 w-6 rounded bg-rule" />
            </div>
            <div className="ledger-body space-y-2">
              <div className="h-3.5 w-2/5 rounded bg-rule" />
              <div className="h-3 w-3/5 rounded bg-paper" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
