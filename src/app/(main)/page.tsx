import Link from 'next/link'
import { ArrowRight, LogOut, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getEntries, getItems, getPeople, indexById } from '@/lib/queries'
import { byItem, byPerson, isLow, personLabel, stockValue, totals } from '@/lib/ledger'
import { formatDay, isMonthKey, monthBounds, monthKeyOf, monthLabel, money, qty } from '@/lib/format'
import { qs } from '@/lib/period'
import { MonthStepper } from '@/components/period-picker'
import { Empty, Section } from '@/components/page'
import { EntryRow } from '@/components/entry-row'
import { BrandMark } from '@/components/nav'
import { logout } from './actions'

export default async function MonthPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams
  const month = isMonthKey(m) ? m : monthKeyOf()
  const supabase = await createClient()

  const [items, people, entries] = await Promise.all([
    getItems(supabase),
    getPeople(supabase),
    getEntries(supabase, monthBounds(month)),
  ])
  const peopleById = indexById(people)
  const itemsById = indexById(items)

  const t = totals(entries)
  const takers = byPerson(entries, peopleById)
  const moved = byItem(entries, itemsById)
  const low = items.filter(isLow)
  const top = takers[0]?.value || 1
  const monthQs = qs({ range: 'month', m: month })
  const shortMonth = monthLabel(month).split(' ')[0]

  return (
    <div>
      <header className="mb-7 px-4 sm:px-0">
        <div className="mb-5 flex items-center justify-between md:hidden">
          <span className="flex items-center gap-2">
            <BrandMark className="size-5" />
            <span className="font-condensed font-semibold tracking-tight">Stock Khata</span>
          </span>
          <form action={logout}>
            <button className="rounded-md p-2 text-ink-faint hover:text-ink" aria-label="Log out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        <MonthStepper path="/" month={month} large />
      </header>

      {/* The month's statement */}
      <div className="ledger space-y-3.5 px-4 py-5 sm:px-6">
        <div className="leader">
          <span className="text-ink-soft">Given out</span>
          <span className="figure text-2xl font-semibold sm:text-3xl">{money(t.outValue)}</span>
        </div>
        <div className="leader text-sm">
          <span className="text-ink-soft">Entries</span>
          <span className="figure">
            {t.outCount} to {takers.length} {takers.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div className="leader text-sm">
          <span className="text-ink-soft">Stock added</span>
          <span className="figure text-green">
            {t.inCount} {t.inCount === 1 ? 'entry' : 'entries'}
            {t.inValue > 0 && <> · {money(t.inValue)}</>}
          </span>
        </div>
        <div className="leader border-t border-dashed border-rule pt-3.5 text-sm">
          <span className="text-ink-soft">Stock on hand today</span>
          <span className="figure">{money(stockValue(items))}</span>
        </div>
      </div>

      <Section
        title={`Who took what in ${shortMonth}`}
        aside={
          takers.length > 0 && (
            <Link href="/people" className="text-ink-soft hover:text-ink">
              Everyone
            </Link>
          )
        }
      >
        {takers.length === 0 ? (
          <Empty
            action={
              <Link href="/entry/new" className="btn-primary">
                <Plus className="size-4" /> New entry
              </Link>
            }
          >
            Nothing given out in {monthLabel(month)}.
          </Empty>
        ) : (
          <ol className="ledger">
            {takers.map((p) => {
              const inner = (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="figure shrink-0">{money(p.value)}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper" aria-hidden>
                    <div className="h-full rounded-full bg-khata/75" style={{ width: `${Math.max(2, (p.value / top) * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {p.count} {p.count === 1 ? 'entry' : 'entries'} · last on {formatDay(p.last)}
                  </p>
                </>
              )
              return (
                <li key={p.key} className="border-b border-rule last:border-0">
                  {p.personId ? (
                    <Link href={`/people/${p.personId}${monthQs}`} className="block px-4 py-3.5 transition-colors hover:bg-paper/60 sm:px-5">
                      {inner}
                    </Link>
                  ) : (
                    <div className="px-4 py-3.5 sm:px-5">{inner}</div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </Section>

      {moved.length > 0 && (
        <Section title={`Items moved in ${shortMonth}`}>
          <div className="ledger">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-rule px-4 py-2 text-xs text-ink-faint sm:px-5">
              <span>Item</span>
              <span className="w-16 text-right">In</span>
              <span className="w-16 text-right">Out</span>
            </div>
            {moved.map((r) => (
              <div key={r.key} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 border-b border-rule px-4 py-3 text-sm last:border-0 sm:px-5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="text-xs text-ink-faint">{r.unit}</span>
                </span>
                <span className="figure w-16 text-right text-green">{r.inQty ? `+${qty(r.inQty)}` : '—'}</span>
                <span className="figure w-16 text-right">{r.outQty ? `−${qty(r.outQty)}` : '—'}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {low.length > 0 && (
        <Link
          href="/stock"
          className="mx-4 mt-6 flex items-center justify-between gap-3 rounded-md bg-khata-wash px-4 py-3 text-sm text-khata sm:mx-0"
        >
          <span>
            Running low: {low.map((i) => i.name.trim()).join(', ')}
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      {entries.length > 0 && (
        <Section
          title="Latest entries"
          aside={
            <Link href={`/history${monthQs}`} className="text-ink-soft hover:text-ink">
              All {entries.length}
            </Link>
          }
        >
          <ul className="ledger">
            {entries.slice(0, 6).map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                personName={personLabel(e, peopleById, e.person_id)}
                itemName={(e.product_id && itemsById.get(e.product_id)?.name) || e.product_name || 'Removed item'}
              />
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
