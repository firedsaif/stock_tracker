import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthKeyOf, monthLabel, shiftMonth, localDate } from '@/lib/format'
import { type Period, qs } from '@/lib/period'

/**
 * Period chips for any page: this month, last month, this year, all time,
 * or a custom from–to range. Works without JavaScript (plain links + GET form).
 * `keep` carries other filters through.
 */
export function PeriodPicker({
  path,
  period,
  keep = {},
}: {
  path: string
  period: Period
  keep?: Record<string, string | undefined>
}) {
  const now = monthKeyOf()
  const year = Number(localDate().slice(0, 4))
  const href = (p: Record<string, string | number | undefined>) => path + qs({ ...keep, ...p })

  const chips = [
    { label: 'This month', p: { range: 'month', m: now }, on: period.range === 'month' && period.month === now },
    {
      label: 'Last month',
      p: { range: 'month', m: shiftMonth(now, -1) },
      on: period.range === 'month' && period.month === shiftMonth(now, -1),
    },
    { label: 'This year', p: { range: 'year', y: year }, on: period.range === 'year' && period.year === year },
    { label: 'All time', p: { range: 'all' }, on: period.range === 'all' },
  ]

  return (
    <div className="no-print space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => (
          <Link key={c.label} href={href(c.p)} aria-current={c.on} className="chip">
            {c.label}
          </Link>
        ))}
        <details className="group shrink-0" open={period.range === 'custom'}>
          <summary aria-current={period.range === 'custom'} className="chip cursor-pointer list-none">
            Pick dates
          </summary>
          <form method="get" action={path} className="ledger mt-2 flex flex-wrap items-end gap-3 p-3 sm:w-max">
            {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
            <input type="hidden" name="range" value="custom" />
            <label className="text-xs text-ink-soft">
              From
              <input type="date" name="from" defaultValue={period.fromDate} max={localDate()} className="field mt-1 h-10" />
            </label>
            <label className="text-xs text-ink-soft">
              To
              <input type="date" name="to" defaultValue={period.toDate} max={localDate()} className="field mt-1 h-10" />
            </label>
            <button className="btn-ink h-10">Show</button>
          </form>
        </details>
      </div>
      {period.range === 'month' && period.month && (
        <MonthStepper path={path} month={period.month} keep={keep} />
      )}
    </div>
  )
}

/** ‹ October 2026 › — flip through months like ledger pages. */
export function MonthStepper({
  path,
  month,
  keep = {},
  large = false,
}: {
  path: string
  month: string
  keep?: Record<string, string | undefined>
  large?: boolean
}) {
  const now = monthKeyOf()
  const prev = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  const canNext = next <= now
  const href = (m: string) => path + qs({ ...keep, range: 'month', m })

  const arrow =
    'inline-flex size-10 items-center justify-center rounded-full border border-rule-strong bg-sheet text-ink-soft transition-colors hover:border-ink hover:text-ink'

  return (
    <div className="no-print flex items-center gap-3">
      <Link href={href(prev)} className={arrow} aria-label={`Previous month, ${monthLabel(prev)}`}>
        <ChevronLeft className="size-4" />
      </Link>
      <p
        className={
          large
            ? 'font-condensed text-[2.25rem] leading-none font-semibold tracking-tight sm:text-5xl'
            : 'min-w-36 text-center font-condensed text-lg font-semibold'
        }
      >
        {monthLabel(month)}
      </p>
      {canNext ? (
        <Link href={href(next)} className={arrow} aria-label={`Next month, ${monthLabel(next)}`}>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={`${arrow} pointer-events-none opacity-30`} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </div>
  )
}
