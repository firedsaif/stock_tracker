import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getEntries, getItems, getPeople, indexById } from '@/lib/queries'
import { byItem, byMonth, totals } from '@/lib/ledger'
import { formatDay, monthLabel, money, qty } from '@/lib/format'
import { type PeriodParams, parsePeriod, periodParams, qs } from '@/lib/period'
import { Empty, Notice, PageHeader, Section } from '@/components/page'
import { PeriodPicker } from '@/components/period-picker'
import { EntryRow } from '@/components/entry-row'
import { PersonMenu } from '../person-forms'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<PeriodParams & { saved?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('people').select('name').eq('id', id).maybeSingle()
  return { title: data?.name ?? 'Person' }
}

export default async function PersonPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const period = parsePeriod(sp, 'all')
  const supabase = await createClient()

  const [people, items, all] = await Promise.all([
    getPeople(supabase),
    getItems(supabase),
    getEntries(supabase, { personId: id }),
  ])
  const person = people.find((p) => p.id === id)
  if (!person) notFound()
  const itemsById = indexById(items)

  const given = all.filter((e) => e.type === 'SELL')
  const inPeriod = given.filter((e) => {
    const t = new Date(e.created_at)
    return (!period.from || t >= period.from) && (!period.to || t < period.to)
  })

  const lifetime = totals(given)
  const picked = totals(inPeriod)
  const pickedItems = byItem(inPeriod, itemsById)
  const months = byMonth(period.range === 'all' ? given : inPeriod, itemsById)
  const maxMonth = Math.max(1, ...months.map((m) => m.value))
  const first = given.at(-1)?.created_at
  const last = given[0]?.created_at
  const itemName = (pid: string | null, fallback: string | null) =>
    (pid && itemsById.get(pid)?.name) || fallback || 'Removed item'

  return (
    <div>
      <PageHeader
        back={{ href: '/people', label: 'People' }}
        title={person.name}
        actions={<PersonMenu person={person} others={people.filter((p) => p.id !== id)} entryCount={all.length} />}
      >
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          {person.phone && (
            <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Phone className="size-3.5" /> {person.phone}
            </a>
          )}
          {person.notes && <span>{person.notes}</span>}
        </div>
        <Link href={`/entry/new${qs({ person: id })}`} className="btn-primary mt-5 w-full sm:w-auto">
          <Plus className="size-4" /> Give stock to {person.name.trim()}
        </Link>
      </PageHeader>

      {sp.saved && (
        <div className="mb-5 px-4 sm:px-0">
          <Notice>Entry saved.</Notice>
        </div>
      )}

      {/* Lifetime account */}
      <div className="ledger space-y-3 px-4 py-5 sm:px-6">
        <div className="leader">
          <span className="text-ink-soft">Total taken, all time</span>
          <span className="figure text-2xl font-semibold sm:text-3xl">{money(lifetime.outValue)}</span>
        </div>
        <div className="leader text-sm">
          <span className="text-ink-soft">Entries</span>
          <span className="figure">{lifetime.outCount}</span>
        </div>
        {first && last && (
          <div className="leader text-sm">
            <span className="text-ink-soft">Taking since</span>
            <span className="figure">
              {formatDay(first, true)} → {formatDay(last, true)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-9 px-4 sm:px-0">
        <PeriodPicker path={`/people/${id}`} period={period} />
      </div>

      {period.range !== 'all' && (
        <div className="ledger mt-4 px-4 py-4 sm:px-6">
          <div className="leader">
            <span className="text-ink-soft">{period.label}</span>
            <span className="figure text-xl font-semibold">{money(picked.outValue)}</span>
          </div>
          <p className="mt-1 text-sm text-ink-faint">
            {picked.outCount} {picked.outCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )}

      {pickedItems.length > 0 && (
        <Section title={period.range === 'all' ? 'What they take' : `What they took · ${period.label}`}>
          <div className="ledger">
            {pickedItems.map((r) => (
              <div key={r.key} className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-3 text-sm last:border-0 sm:px-5">
                <span className="min-w-0 truncate font-medium">{r.name}</span>
                <span className="shrink-0 text-right">
                  <span className="figure">{qty(r.outQty)}</span> <span className="text-ink-faint">{r.unit}</span>
                  <span className="figure ml-3 inline-block min-w-24 text-ink-soft">{money(r.outValue)}</span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {months.length > 1 && (
        <Section title="Month by month">
          <ol className="ledger">
            {months.map((m) => (
              <li key={m.month} className="border-b border-rule last:border-0">
                <Link
                  href={`/people/${id}${qs({ range: 'month', m: m.month })}`}
                  className="block px-4 py-3 transition-colors hover:bg-paper/60 sm:px-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{monthLabel(m.month)}</span>
                    <span className="figure">{money(m.value)}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper" aria-hidden>
                    <div className="h-full rounded-full bg-khata/75" style={{ width: `${Math.max(2, (m.value / maxMonth) * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 truncate text-xs text-ink-faint">
                    {m.count} {m.count === 1 ? 'entry' : 'entries'} ·{' '}
                    {m.items.map((i) => `${qty(i.outQty)} ${i.name.trim()}`).join(', ')}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section
        title={period.range === 'all' ? 'Every entry' : `Entries · ${period.label}`}
        aside={
          inPeriod.length > 0 && (
            <Link href={`/history${qs({ ...periodParams(period), person: id })}`} className="text-ink-soft hover:text-ink">
              Print view
            </Link>
          )
        }
      >
        {inPeriod.length === 0 ? (
          <Empty>{person.name.trim()} took nothing in this period.</Empty>
        ) : (
          <ul className="ledger">
            {inPeriod.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                personName={person.name}
                itemName={itemName(e.product_id, e.product_name)}
                showPerson={false}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
