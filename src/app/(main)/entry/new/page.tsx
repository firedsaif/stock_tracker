import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getItems, getPeople } from '@/lib/queries'
import { Empty, PageHeader } from '@/components/page'
import { EntryForm } from './entry-form'

export const metadata: Metadata = { title: 'New entry' }

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; item?: string; person?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const [items, people] = await Promise.all([getItems(supabase), getPeople(supabase)])

  return (
    <div>
      <PageHeader title="New entry" />
      {items.length === 0 ? (
        <Empty
          action={
            <Link href="/stock" className="btn-ink">
              Go to Stock
            </Link>
          }
        >
          Add an item to your stock first.
        </Empty>
      ) : (
        <div className="px-4 sm:px-0">
          <EntryForm
            items={items}
            people={people}
            defaults={{
              type: sp.type === 'ADD' ? 'ADD' : 'SELL',
              itemId: items.some((i) => i.id === sp.item) ? sp.item : undefined,
              personId: people.some((p) => p.id === sp.person) ? sp.person : undefined,
            }}
          />
        </div>
      )}
    </div>
  )
}
