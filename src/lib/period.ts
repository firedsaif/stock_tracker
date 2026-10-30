import {
  type MonthKey,
  dayStart,
  isDateString,
  isMonthKey,
  monthBounds,
  monthKeyOf,
  monthLabel,
  formatDay,
  localDate,
} from './format'

export type RangeKind = 'month' | 'year' | 'all' | 'custom'

export type Period = {
  range: RangeKind
  /** inclusive start instant */
  from?: Date
  /** exclusive end instant */
  to?: Date
  label: string
  month?: MonthKey
  year?: number
  fromDate?: string
  toDate?: string
}

export type PeriodParams = {
  range?: string
  m?: string
  y?: string
  from?: string
  to?: string
}

export function parsePeriod(sp: PeriodParams, fallback: RangeKind = 'month'): Period {
  const range = (['month', 'year', 'all', 'custom'] as const).find((r) => r === sp.range) ?? fallback

  if (range === 'all') return { range, label: 'All time' }

  if (range === 'year') {
    const year = /^\d{4}$/.test(sp.y ?? '') ? Number(sp.y) : Number(localDate().slice(0, 4))
    return {
      range,
      year,
      from: dayStart(`${year}-01-01`),
      to: dayStart(`${year + 1}-01-01`),
      label: String(year),
    }
  }

  if (range === 'custom' && (isDateString(sp.from) || isDateString(sp.to))) {
    const fromDate = isDateString(sp.from) ? sp.from : undefined
    const toDate = isDateString(sp.to) ? sp.to : undefined
    const to = toDate ? new Date(dayStart(toDate).getTime() + 86_400_000) : undefined
    const label =
      fromDate && toDate
        ? `${formatDay(fromDate, true)} – ${formatDay(toDate, true)}`
        : fromDate
          ? `Since ${formatDay(fromDate, true)}`
          : `Until ${formatDay(toDate!, true)}`
    return { range, fromDate, toDate, from: fromDate ? dayStart(fromDate) : undefined, to, label }
  }

  const month = isMonthKey(sp.m) ? sp.m : monthKeyOf()
  return { range: 'month', month, ...monthBounds(month), label: monthLabel(month) }
}

/** Build a query string, dropping empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v))
  }
  const out = s.toString()
  return out ? `?${out}` : ''
}

export function periodParams(p: Period): Record<string, string | undefined> {
  switch (p.range) {
    case 'all':
      return { range: 'all' }
    case 'year':
      return { range: 'year', y: String(p.year) }
    case 'custom':
      return { range: 'custom', from: p.fromDate, to: p.toDate }
    default:
      return { range: 'month', m: p.month }
  }
}
