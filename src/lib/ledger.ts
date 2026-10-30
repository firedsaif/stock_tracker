import { type MonthKey, monthKeyOf } from './format'

export type Item = {
  id: string
  created_at: string
  name: string
  category: string | null
  unit: string
  stock: number
  price: number
  low_stock_limit: number
}

export type Person = {
  id: string
  created_at: string
  name: string
  phone: string | null
  notes: string | null
}

export type Entry = {
  id: string
  created_at: string
  type: 'ADD' | 'SELL'
  quantity: number
  unit_price: number | null
  total_price: number | null
  unit_cost: number | null
  product_id: string | null
  product_name: string | null
  product_unit: string | null
  person_id: string | null
  sold_to: string | null
  notes: string | null
}

export const ENTRY_COLUMNS =
  'id, created_at, type, quantity, unit_price, total_price, unit_cost, product_id, product_name, product_unit, person_id, sold_to, notes'

/** Money value of an entry: sale value for stock given out, cost for stock added. */
export function entryValue(e: Entry): number {
  if (e.type === 'SELL') return Number(e.total_price ?? (e.unit_price ?? 0) * e.quantity)
  return Number(e.unit_cost ?? 0) * e.quantity
}

export function personLabel(e: Pick<Entry, 'sold_to'>, people?: Map<string, Person>, personId?: string | null) {
  const p = personId ? people?.get(personId) : undefined
  return p?.name ?? (e.sold_to?.trim() || 'No name')
}

export type Totals = {
  outValue: number
  outCount: number
  inValue: number
  inCount: number
}

export function totals(entries: Entry[]): Totals {
  const t: Totals = { outValue: 0, outCount: 0, inValue: 0, inCount: 0 }
  for (const e of entries) {
    if (e.type === 'SELL') {
      t.outValue += entryValue(e)
      t.outCount++
    } else {
      t.inValue += entryValue(e)
      t.inCount++
    }
  }
  return t
}

export type PersonRow = {
  key: string
  personId: string | null
  name: string
  value: number
  count: number
  last: string
}

/** Stock given out, grouped by who took it, biggest first. */
export function byPerson(entries: Entry[], people: Map<string, Person>): PersonRow[] {
  const rows = new Map<string, PersonRow>()
  for (const e of entries) {
    if (e.type !== 'SELL') continue
    const name = personLabel(e, people, e.person_id)
    const key = e.person_id ?? `name:${name.toLowerCase()}`
    const row = rows.get(key) ?? { key, personId: e.person_id, name, value: 0, count: 0, last: e.created_at }
    row.value += entryValue(e)
    row.count++
    if (e.created_at > row.last) row.last = e.created_at
    rows.set(key, row)
  }
  return [...rows.values()].sort((a, b) => b.value - a.value || b.count - a.count)
}

export type ItemRow = {
  key: string
  productId: string | null
  name: string
  unit: string
  inQty: number
  outQty: number
  outValue: number
  inValue: number
}

/** Quantities per item; units differ between items so they are never summed across items. */
export function byItem(entries: Entry[], items?: Map<string, Item>): ItemRow[] {
  const rows = new Map<string, ItemRow>()
  for (const e of entries) {
    const item = e.product_id ? items?.get(e.product_id) : undefined
    const name = item?.name ?? e.product_name ?? 'Removed item'
    const key = e.product_id ?? `name:${name}`
    const row = rows.get(key) ?? {
      key,
      productId: e.product_id,
      name,
      unit: item?.unit ?? e.product_unit ?? '',
      inQty: 0,
      outQty: 0,
      outValue: 0,
      inValue: 0,
    }
    if (e.type === 'SELL') {
      row.outQty += e.quantity
      row.outValue += entryValue(e)
    } else {
      row.inQty += e.quantity
      row.inValue += entryValue(e)
    }
    rows.set(key, row)
  }
  return [...rows.values()].sort((a, b) => b.outValue - a.outValue || b.outQty + b.inQty - (a.outQty + a.inQty))
}

export type MonthRow = { month: MonthKey; value: number; count: number; items: ItemRow[] }

/** Stock given out, month by month, newest first. */
export function byMonth(entries: Entry[], items?: Map<string, Item>): MonthRow[] {
  const groups = new Map<MonthKey, Entry[]>()
  for (const e of entries) {
    if (e.type !== 'SELL') continue
    const k = monthKeyOf(e.created_at)
    groups.set(k, [...(groups.get(k) ?? []), e])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([month, list]) => ({
      month,
      value: list.reduce((s, e) => s + entryValue(e), 0),
      count: list.length,
      items: byItem(list, items),
    }))
}

export function stockValue(items: Item[]): number {
  return items.reduce((s, i) => s + Math.max(0, i.stock) * Number(i.price ?? 0), 0)
}

export function isLow(item: Item): boolean {
  return item.stock <= (item.low_stock_limit ?? 0)
}
