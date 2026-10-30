// Dates are grouped by the owner's local calendar (Pakistan, UTC+5, no DST),
// not the server's, so a late-night entry lands in the right day and month.
export const TIME_ZONE = 'Asia/Karachi'
const OFFSET = '+05:00'

/** 'YYYY-MM' */
export type MonthKey = string

const ymd = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Local calendar date as 'YYYY-MM-DD'. */
export function localDate(date: Date | string = new Date()): string {
  return ymd.format(new Date(date))
}

export function monthKeyOf(date: Date | string = new Date()): MonthKey {
  return localDate(date).slice(0, 7)
}

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

export function isDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value))
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Start of a local day as an instant. */
export function dayStart(date: string): Date {
  return new Date(`${date}T00:00:00${OFFSET}`)
}

export function monthBounds(key: MonthKey): { from: Date; to: Date } {
  return { from: dayStart(`${key}-01`), to: dayStart(`${shiftMonth(key, 1)}-01`) }
}

export function monthLabel(key: MonthKey, style: 'long' | 'short' = 'long'): string {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    month: style,
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)))
}

export function formatDay(date: Date | string, withYear = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: TIME_ZONE,
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(new Date(date))
}

/** Two-line ledger margin: '30' / 'OCT'. */
export function marginDate(date: Date | string): { day: string; month: string } {
  const d = new Date(date)
  return {
    day: new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone: TIME_ZONE }).format(d),
    month: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: TIME_ZONE }).format(d),
  }
}

const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function qty(n: number): string {
  return number.format(n)
}

export function money(n: number): string {
  return `Rs ${number.format(Math.round(n * 100) / 100)}`
}
