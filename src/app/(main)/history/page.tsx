import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getEntries, getItems, getPeople, indexById } from '@/lib/queries'
import { personLabel, totals } from '@/lib/ledger'
import { money } from '@/lib/format'
import { type PeriodParams, parsePeriod } from '@/lib/period'
import { Empty, PageHeader } from '@/components/page'
import { PeriodPicker } from '@/components/period-picker'
import { EntryRow } from '@/components/entry-row'
import { PrintButton } from './print-button'

export const metadata: Metadata = { title: 'All entries' }

type Filters = PeriodParams & { type?: string; person?: string; item?: string }

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const sp = await searchParams
  const period = parsePeriod(sp, 'month')
  const type = sp.type === 'ADD' || sp.type === 'SELL' ? sp.type : undefined
  const supabase = await createClient()

  const [items, people] = await Promise.all([getItems(supabase), getPeople(supabase)])
  const personId = people.some((p) => p.id === sp.person) ? sp.person : undefined
  const productId = sp.item && /^[0-9a-f-]{36}$/i.test(sp.item) ? sp.item : undefined
  const entries = await getEntries(supabase, {
    from: period.from,
    to: period.to,
    type: personId ? 'SELL' : type,
    personId,
    productId,
  })

  const peopleById = indexById(people)
  const itemsById = indexById(items)
  const t = totals(entries)
  const person = personId ? peopleById.get(personId) : undefined
  const item = productId ? itemsById.get(productId) : undefined
  const keep = { type, person: personId, item: productId }

  const subtitle = [person?.name, item?.name, period.label].filter(Boolean).join(' · ')

  return (
    <div>
      <PageHeader title="All entries" eyebrow={subtitle} actions={<PrintButton />} />

      <div className="space-y-3 px-4 sm:px-0">
        <PeriodPicker path="/history" period={period} keep={keep} />

        <form method="get" className="no-print grid grid-cols-3 gap-2">
          {Object.entries({ range: sp.range, m: sp.m, y: sp.y, from: sp.from, to: sp.to }).map(
            ([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />
          )}
          <select name="type" defaultValue={type ?? ''} className="field h-10 text-sm" aria-label="Entry type">
            <option value="">In &amp; out</option>
            <option value="SELL">Given out</option>
            <option value="ADD">Stock added</option>
          </select>
          <select name="person" defaultValue={personId ?? ''} className="field h-10 text-sm" aria-label="Person">
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="item" defaultValue={productId ?? ''} className="field h-10 text-sm" aria-label="Item">
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <button className="btn-ink btn-sm col-span-3 sm:col-span-1 sm:col-start-3">Apply filters</button>
        </form>
      </div>

      <div className="ledger mt-6 flex flex-wrap gap-x-8 gap-y-2 px-4 py-4 text-sm sm:px-6">
        <p>
          <span className="text-ink-soft">Given out </span>
          <span className="figure font-semibold">{money(t.outValue)}</span>
          <span className="text-ink-faint"> · {t.outCount}</span>
        </p>
        {!personId && (
          <p>
            <span className="text-ink-soft">Stock added </span>
            <span className="figure font-semibold text-green">{t.inCount}</span>
            {t.inValue > 0 && <span className="figure text-ink-faint"> · {money(t.inValue)}</span>}
          </p>
        )}
      </div>

      <div className="mt-4">
        {entries.length === 0 ? (
          <Empty>No entries match these filters.</Empty>
        ) : (
          <ul className="ledger">
            {entries.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                personName={personLabel(e, peopleById, e.person_id)}
                itemName={(e.product_id && itemsById.get(e.product_id)?.name) || e.product_name || 'Removed item'}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
