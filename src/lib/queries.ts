import { createClient } from '@/utils/supabase/server'
import { ENTRY_COLUMNS, type Entry, type Item, type Person } from './ledger'

type Client = Awaited<ReturnType<typeof createClient>>

const PAGE = 1000

export async function getItems(supabase: Client): Promise<Item[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, created_at, name, category, unit, stock, price, low_stock_limit')
    .order('name')
  if (error) throw new Error(`Could not load items: ${error.message}`)
  return (data ?? []).map((i) => ({ ...i, price: Number(i.price ?? 0) }))
}

export async function getPeople(supabase: Client): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('id, created_at, name, phone, notes')
    .order('name')
  if (error) throw new Error(`Could not load people: ${error.message}`)
  return data ?? []
}

export type EntryFilter = {
  from?: Date
  to?: Date
  personId?: string
  productId?: string
  type?: 'ADD' | 'SELL'
  limit?: number
}

/** Entries newest first. Pages through Supabase's 1000-row cap unless a limit is set. */
export async function getEntries(supabase: Client, f: EntryFilter = {}): Promise<Entry[]> {
  const out: Entry[] = []
  for (let offset = 0; ; offset += PAGE) {
    let q = supabase
      .from('transactions')
      .select(ENTRY_COLUMNS)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (f.from) q = q.gte('created_at', f.from.toISOString())
    if (f.to) q = q.lt('created_at', f.to.toISOString())
    if (f.personId) q = q.eq('person_id', f.personId)
    if (f.productId) q = q.eq('product_id', f.productId)
    if (f.type) q = q.eq('type', f.type)

    const size = f.limit ? Math.min(f.limit - out.length, PAGE) : PAGE
    const { data, error } = await q.range(offset, offset + size - 1)
    if (error) throw new Error(`Could not load entries: ${error.message}`)
    out.push(...((data ?? []) as Entry[]))
    if (!data || data.length < size || (f.limit && out.length >= f.limit)) break
  }
  return out
}

export function indexById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]))
}
