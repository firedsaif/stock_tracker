import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getEntries, getPeople, indexById } from '@/lib/queries'
import { byPerson } from '@/lib/ledger'
import { formatDay, monthBounds, monthKeyOf, monthLabel, money } from '@/lib/format'
import { Empty, PageHeader } from '@/components/page'
import { AddPersonButton } from './person-forms'

export const metadata: Metadata = { title: 'People' }

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const supabase = await createClient()
  const month = monthKeyOf()
  const [people, given] = await Promise.all([getPeople(supabase), getEntries(supabase, { type: 'SELL' })])
  const peopleById = indexById(people)

  const { from } = monthBounds(month)
  const allTime = new Map(byPerson(given, peopleById).map((r) => [r.personId, r]))
  const thisMonth = new Map(
    byPerson(given.filter((e) => new Date(e.created_at) >= from), peopleById).map((r) => [r.personId, r])
  )

  const needle = q.trim().toLowerCase()
  const rows = people
    .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.phone?.includes(needle))
    .map((p) => ({ p, all: allTime.get(p.id), now: thisMonth.get(p.id) }))
    .sort((a, b) => (b.now?.value ?? 0) - (a.now?.value ?? 0) || (b.all?.value ?? 0) - (a.all?.value ?? 0))

  return (
    <div>
      <PageHeader title="People" eyebrow={`${people.length} in your khata`} actions={<AddPersonButton />}>
        <form method="get" className="relative mt-5">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <input name="q" type="search" defaultValue={q} placeholder="Find by name or phone" className="field pl-9" />
        </form>
      </PageHeader>

      {rows.length === 0 ? (
        <Empty action={!needle && <AddPersonButton />}>
          {needle ? `No one called “${q}”.` : 'No one yet. People are added the first time you give them stock.'}
        </Empty>
      ) : (
        <>
          <div className="flex justify-between px-4 pb-2 text-xs text-ink-faint sm:px-5">
            <span>Name</span>
            <span>{monthLabel(month).split(' ')[0]} · all time</span>
          </div>
          <ul className="ledger">
            {rows.map(({ p, all, now }) => (
              <li key={p.id} className="border-b border-rule last:border-0">
                <Link href={`/people/${p.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-paper/60 sm:px-5">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper font-condensed text-sm font-semibold text-ink-soft"
                  >
                    {p.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {all ? `Last took on ${formatDay(all.last, true)}` : 'Nothing taken yet'}
                      {p.phone && ` · ${p.phone}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`figure block text-[0.95rem] ${now ? '' : 'text-ink-faint'}`}>
                      {now ? money(now.value) : '—'}
                    </span>
                    <span className="figure block text-xs text-ink-faint">{all ? money(all.value) : 'Rs 0'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
